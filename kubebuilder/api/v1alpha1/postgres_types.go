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

package v1alpha1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/runtime"
)

// EDIT THIS FILE!  THIS IS SCAFFOLDING FOR YOU TO OWN!
// NOTE: json tags are required.  Any new fields you add must have json tags for the fields to be serialized.

// PostgresSpec defines the desired state of Postgres
type PostgresSpec struct {
	// version is the PostgreSQL image tag to run (e.g. "16", "16.4").
	// +kubebuilder:default="16"
	// +optional
	Version string `json:"version,omitempty"`

	// database is the name of the default database created at startup.
	// +kubebuilder:default="app"
	// +optional
	Database string `json:"database,omitempty"`

	// username is the superuser created at startup.
	// +kubebuilder:default="app"
	// +optional
	Username string `json:"username,omitempty"`

	// storageSize is the size of the persistent volume backing the data (e.g. "1Gi").
	// +kubebuilder:default="1Gi"
	// +optional
	StorageSize string `json:"storageSize,omitempty"`

	// storageClassName is the StorageClass used for the persistent volume.
	// Leave empty to use the cluster default StorageClass.
	// +optional
	StorageClassName string `json:"storageClassName,omitempty"`
}

// PostgresStatus defines the observed state of Postgres.
type PostgresStatus struct {
	// INSERT ADDITIONAL STATUS FIELD - define observed state of cluster
	// Important: Run "make" to regenerate code after modifying this file

	// For Kubernetes API conventions, see:
	// https://github.com/kubernetes/community/blob/master/contributors/devel/sig-architecture/api-conventions.md#typical-status-properties

	// conditions represent the current state of the Postgres resource.
	// Each condition has a unique type and reflects the status of a specific aspect of the resource.
	//
	// Standard condition types include:
	// - "Available": the resource is fully functional
	// - "Progressing": the resource is being created or updated
	// - "Degraded": the resource failed to reach or maintain its desired state
	//
	// The status of each condition is one of True, False, or Unknown.
	// +listType=map
	// +listMapKey=type
	// +optional
	Conditions []metav1.Condition `json:"conditions,omitempty"`

	// ready is true when the PostgreSQL instance has at least one ready replica.
	// +optional
	Ready bool `json:"ready,omitempty"`

	// secretName is the name of the Secret holding the generated credentials.
	// +optional
	SecretName string `json:"secretName,omitempty"`
}

// +kubebuilder:object:root=true
// +kubebuilder:subresource:status

// Postgres is the Schema for the postgres API
type Postgres struct {
	metav1.TypeMeta `json:",inline"`

	// metadata is a standard object metadata
	// +optional
	metav1.ObjectMeta `json:"metadata,omitzero"`

	// spec defines the desired state of Postgres
	// +required
	Spec PostgresSpec `json:"spec"`

	// status defines the observed state of Postgres
	// +optional
	Status PostgresStatus `json:"status,omitzero"`
}

// +kubebuilder:object:root=true

// PostgresList contains a list of Postgres
type PostgresList struct {
	metav1.TypeMeta `json:",inline"`
	metav1.ListMeta `json:"metadata,omitzero"`
	Items           []Postgres `json:"items"`
}

func init() {
	SchemeBuilder.Register(func(s *runtime.Scheme) error {
		s.AddKnownTypes(SchemeGroupVersion, &Postgres{}, &PostgresList{})
		return nil
	})
}
