/*
Copyright 2026.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package controller

import (
	"context"
	"crypto/rand"
	"encoding/hex"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	logf "sigs.k8s.io/controller-runtime/pkg/log"

	webappv1alpha1 "lab.com/website-operator/api/v1alpha1"
)

const postgresPort = 5432

// PostgresReconciler reconciles a Postgres object
type PostgresReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=webapp.lab.com,resources=postgres,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=webapp.lab.com,resources=postgres/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=webapp.lab.com,resources=postgres/finalizers,verbs=update
// +kubebuilder:rbac:groups=apps,resources=statefulsets,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=secrets,verbs=get;list;watch;create;update;patch;delete

// Reconcile ensures a PostgreSQL StatefulSet, Service and credentials Secret
// exist that match the Postgres spec.
func (r *PostgresReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	// 1. Fetch the Postgres instance.
	var pg webappv1alpha1.Postgres
	if err := r.Get(ctx, req.NamespacedName, &pg); err != nil {
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	version := pg.Spec.Version
	if version == "" {
		version = "16"
	}
	database := pg.Spec.Database
	if database == "" {
		database = "app"
	}
	username := pg.Spec.Username
	if username == "" {
		username = "app"
	}
	storageSize := pg.Spec.StorageSize
	if storageSize == "" {
		storageSize = "1Gi"
	}
	labels := map[string]string{"app": pg.Name, "app.kubernetes.io/component": "postgres"}
	secretName := pg.Name + "-postgres"

	// 2. Ensure the credentials Secret exists. The password is generated once
	//    and never overwritten on subsequent reconciles.
	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{Name: secretName, Namespace: pg.Namespace},
	}
	if err := r.Get(ctx, client.ObjectKeyFromObject(secret), secret); err != nil {
		if !apierrors.IsNotFound(err) {
			return ctrl.Result{}, err
		}
		password, gerr := generatePassword()
		if gerr != nil {
			return ctrl.Result{}, gerr
		}
		secret.Labels = labels
		secret.StringData = map[string]string{
			"POSTGRES_DB":       database,
			"POSTGRES_USER":     username,
			"POSTGRES_PASSWORD": password,
		}
		if err := controllerutil.SetControllerReference(&pg, secret, r.Scheme); err != nil {
			return ctrl.Result{}, err
		}
		if err := r.Create(ctx, secret); err != nil {
			return ctrl.Result{}, err
		}
	}

	// 3. Create or update a headless Service fronting the PostgreSQL pod.
	svc := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{Name: pg.Name, Namespace: pg.Namespace},
	}
	if _, err := controllerutil.CreateOrUpdate(ctx, r.Client, svc, func() error {
		svc.Labels = labels
		svc.Spec.Selector = labels
		svc.Spec.ClusterIP = corev1.ClusterIPNone
		svc.Spec.Ports = []corev1.ServicePort{{
			Name:       "postgres",
			Port:       postgresPort,
			TargetPort: intstr.FromInt(postgresPort),
		}}
		return controllerutil.SetControllerReference(&pg, svc, r.Scheme)
	}); err != nil {
		log.Error(err, "unable to create or update Service")
		return ctrl.Result{}, err
	}

	// 4. Create or update the StatefulSet running PostgreSQL.
	quantity, err := resource.ParseQuantity(storageSize)
	if err != nil {
		log.Error(err, "invalid storageSize", "value", storageSize)
		return ctrl.Result{}, err
	}
	replicas := int32(1)
	sts := &appsv1.StatefulSet{
		ObjectMeta: metav1.ObjectMeta{Name: pg.Name, Namespace: pg.Namespace},
	}
	if _, err := controllerutil.CreateOrUpdate(ctx, r.Client, sts, func() error {
		sts.Labels = labels
		sts.Spec.ServiceName = pg.Name
		sts.Spec.Replicas = &replicas
		sts.Spec.Selector = &metav1.LabelSelector{MatchLabels: labels}
		sts.Spec.Template = corev1.PodTemplateSpec{
			ObjectMeta: metav1.ObjectMeta{Labels: labels},
			Spec: corev1.PodSpec{
				Containers: []corev1.Container{{
					Name:  "postgres",
					Image: "postgres:" + version,
					Ports: []corev1.ContainerPort{{
						Name:          "postgres",
						ContainerPort: postgresPort,
					}},
					EnvFrom: []corev1.EnvFromSource{{
						SecretRef: &corev1.SecretEnvSource{
							LocalObjectReference: corev1.LocalObjectReference{Name: secretName},
						},
					}},
					Env: []corev1.EnvVar{{
						Name:  "PGDATA",
						Value: "/var/lib/postgresql/data/pgdata",
					}},
					VolumeMounts: []corev1.VolumeMount{{
						Name:      "data",
						MountPath: "/var/lib/postgresql/data",
					}},
					ReadinessProbe: &corev1.Probe{
						ProbeHandler: corev1.ProbeHandler{
							Exec: &corev1.ExecAction{
								Command: []string{"pg_isready", "-U", username, "-d", database},
							},
						},
						InitialDelaySeconds: 5,
						PeriodSeconds:       10,
					},
				}},
			},
		}
		// volumeClaimTemplates are immutable, so only set them on creation.
		if sts.CreationTimestamp.IsZero() {
			pvc := corev1.PersistentVolumeClaim{
				ObjectMeta: metav1.ObjectMeta{Name: "data"},
				Spec: corev1.PersistentVolumeClaimSpec{
					AccessModes: []corev1.PersistentVolumeAccessMode{corev1.ReadWriteOnce},
					Resources: corev1.VolumeResourceRequirements{
						Requests: corev1.ResourceList{corev1.ResourceStorage: quantity},
					},
				},
			}
			if pg.Spec.StorageClassName != "" {
				pvc.Spec.StorageClassName = &pg.Spec.StorageClassName
			}
			sts.Spec.VolumeClaimTemplates = []corev1.PersistentVolumeClaim{pvc}
		}
		return controllerutil.SetControllerReference(&pg, sts, r.Scheme)
	}); err != nil {
		log.Error(err, "unable to create or update StatefulSet")
		return ctrl.Result{}, err
	}

	// 5. Reflect the observed state back into the Postgres status.
	current := &appsv1.StatefulSet{}
	if err := r.Get(ctx, req.NamespacedName, current); err != nil && !apierrors.IsNotFound(err) {
		return ctrl.Result{}, err
	}
	ready := current.Status.ReadyReplicas >= 1
	if pg.Status.Ready != ready || pg.Status.SecretName != secretName {
		pg.Status.Ready = ready
		pg.Status.SecretName = secretName
		if err := r.Status().Update(ctx, &pg); err != nil {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

// generatePassword returns a 32-character hex password from a crypto-secure source.
func generatePassword() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *PostgresReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&webappv1alpha1.Postgres{}).
		Owns(&appsv1.StatefulSet{}).
		Owns(&corev1.Service{}).
		Owns(&corev1.Secret{}).
		Named("postgres").
		Complete(r)
}
