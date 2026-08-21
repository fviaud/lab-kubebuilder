# Build l'image depuis le dossier frontend
docker_build(
    'myapp',
    context='./frontend',
    dockerfile='./frontend/dockerfile-tilt',
    live_update=[
        sync('./frontend', '/opt/app'),
        run('cd /opt/app && npm ci', trigger=['./frontend/package.json', './frontend/package-lock.json']),
    ],
)

docker_build(
    'backend',
    context='./backend',
    dockerfile='./backend/dockerfile-tilt',
    live_update=[
        sync('./backend', '/opt/app'),
    ],
)

# Install the Website CRD before applying any Website custom resources.
k8s_yaml(kustomize('./kubebuilder/config/crd'))

# Website is a custom resource, so declare where its container image lives.
k8s_kind('Website', image_json_path='{.spec.image}')

k8s_yaml(kustomize('./kubebuilder/config/samples'))