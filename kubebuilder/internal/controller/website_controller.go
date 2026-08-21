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

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
	"k8s.io/apimachinery/pkg/util/intstr"
	ctrl "sigs.k8s.io/controller-runtime"
	"sigs.k8s.io/controller-runtime/pkg/client"
	"sigs.k8s.io/controller-runtime/pkg/controller/controllerutil"
	logf "sigs.k8s.io/controller-runtime/pkg/log"

	webappv1 "lab.com/website-operator/api/v1alpha1"
)

// WebsiteReconciler reconciles a Website object
type WebsiteReconciler struct {
	client.Client
	Scheme *runtime.Scheme
}

// +kubebuilder:rbac:groups=webapp.lab.com,resources=websites,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=webapp.lab.com,resources=websites/status,verbs=get;update;patch
// +kubebuilder:rbac:groups=webapp.lab.com,resources=websites/finalizers,verbs=update
// +kubebuilder:rbac:groups=apps,resources=deployments,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups="",resources=services,verbs=get;list;watch;create;update;patch;delete
// +kubebuilder:rbac:groups=networking.k8s.io,resources=ingresses,verbs=get;list;watch;create;update;patch;delete

// Reconcile ensures a Deployment exists that matches the Website spec.
func (r *WebsiteReconciler) Reconcile(ctx context.Context, req ctrl.Request) (ctrl.Result, error) {
	log := logf.FromContext(ctx)

	// 1. Fetch the Website instance.
	var website webappv1.Website
	if err := r.Get(ctx, req.NamespacedName, &website); err != nil {
		// Ignore not-found errors: the object was deleted, the owned
		// Deployment is garbage-collected automatically.
		return ctrl.Result{}, client.IgnoreNotFound(err)
	}

	replicas := website.Spec.Replicas
	if replicas == 0 {
		replicas = 1
	}
	labels := map[string]string{"app": website.Name}

	// 2. Build the desired Deployment.
	deploy := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name:      website.Name,
			Namespace: website.Namespace,
		},
	}

	// 3. Create or update it so it matches the desired state.
	_, err := controllerutil.CreateOrUpdate(ctx, r.Client, deploy, func() error {
		deploy.Labels = labels
		deploy.Spec.Replicas = &replicas
		deploy.Spec.Selector = &metav1.LabelSelector{MatchLabels: labels}
		deploy.Spec.Template = corev1.PodTemplateSpec{
			ObjectMeta: metav1.ObjectMeta{Labels: labels},
			Spec: corev1.PodSpec{
				Containers: []corev1.Container{{
					Name:            "website",
					Image:           website.Spec.Image,
					ImagePullPolicy: corev1.PullAlways,
					Ports:           []corev1.ContainerPort{{ContainerPort: 80}},
					Env:             website.Spec.Env,
				}},
			},
		}
		// Set Website as the owner so the Deployment is cleaned up with it.
		return controllerutil.SetControllerReference(&website, deploy, r.Scheme)
	})
	if err != nil {
		log.Error(err, "unable to create or update Deployment")
		return ctrl.Result{}, err
	}

	// 4. Create or update a Service that fronts the website pods.
	svc := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name:      website.Name,
			Namespace: website.Namespace,
		},
	}

	_, err = controllerutil.CreateOrUpdate(ctx, r.Client, svc, func() error {
		svc.Labels = labels
		svc.Spec.Selector = labels
		svc.Spec.Ports = []corev1.ServicePort{{
			Name:       "http",
			Port:       80,
			TargetPort: intstr.FromInt(3000),
		}}
		svc.Spec.Type = corev1.ServiceTypeClusterIP

		return controllerutil.SetControllerReference(&website, svc, r.Scheme)
	})
	if err != nil {
		log.Error(err, "unable to create or update Service")
		return ctrl.Result{}, err
	}

	// 5. Create or update an Ingress handled by Traefik.
	ing := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name:      website.Name,
			Namespace: website.Namespace,
		},
	}

	_, err = controllerutil.CreateOrUpdate(ctx, r.Client, ing, func() error {
		ingressClassName := "traefik"
		pathType := networkingv1.PathTypePrefix
		ingressHost := website.Spec.Host
		if ingressHost == "" {
			ingressHost = website.Name + ".local"
		}

		ing.Labels = labels
		ing.Spec.IngressClassName = &ingressClassName
		ing.Spec.Rules = []networkingv1.IngressRule{{
			Host: ingressHost,
			IngressRuleValue: networkingv1.IngressRuleValue{
				HTTP: &networkingv1.HTTPIngressRuleValue{
					Paths: []networkingv1.HTTPIngressPath{{
						Path:     "/",
						PathType: &pathType,
						Backend: networkingv1.IngressBackend{
							Service: &networkingv1.IngressServiceBackend{
								Name: website.Name,
								Port: networkingv1.ServiceBackendPort{Number: 80},
							},
						},
					}},
				},
			},
		}}

		return controllerutil.SetControllerReference(&website, ing, r.Scheme)
	})
	if err != nil {
		log.Error(err, "unable to create or update Ingress")
		return ctrl.Result{}, err
	}

	// 6. Reflect the observed state back into the Website status.
	current := &appsv1.Deployment{}
	if err := r.Get(ctx, req.NamespacedName, current); err != nil && !apierrors.IsNotFound(err) {
		return ctrl.Result{}, err
	}
	if website.Status.ReadyReplicas != current.Status.ReadyReplicas {
		website.Status.ReadyReplicas = current.Status.ReadyReplicas
		if err := r.Status().Update(ctx, &website); err != nil {
			return ctrl.Result{}, err
		}
	}

	return ctrl.Result{}, nil
}

// SetupWithManager sets up the controller with the Manager.
func (r *WebsiteReconciler) SetupWithManager(mgr ctrl.Manager) error {
	return ctrl.NewControllerManagedBy(mgr).
		For(&webappv1.Website{}).
		Owns(&appsv1.Deployment{}).
		Owns(&corev1.Service{}).
		Owns(&networkingv1.Ingress{}).
		Named("website").
		Complete(r)
}
