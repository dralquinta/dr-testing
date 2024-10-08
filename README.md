# dr-testing


Config: 


1. Create two clusters: 

```shell
gcloud container clusters create cluster-santiago \
    --region southamerica-west1 \
    --num-nodes 1 \
    --enable-autoscaling \
    --min-nodes 1 \
    --max-nodes 6 \
    --release-channel regular \
    --network=my-custom-vpc \
    --subnetwork=custom-subnet-santiago \
    --enable-ip-alias \
    --enable-network-policy \
    --enable-private-nodes \
    --enable-master-authorized-networks \
    --master-authorized-networks $(curl -s https://ifconfig.me)/32

```
Expected Output: 

```shell
Creating cluster cluster-santiago in southamerica-west1... Cluster is being health-checked (Kubernetes Control Plane is healthy)...done.                                                                                                                                                                                                                                                                                                                                                             
Created [https://container.googleapis.com/v1/projects/dryruns/zones/southamerica-west1/clusters/cluster-santiago].
To inspect the contents of your cluster, go to: https://console.cloud.google.com/kubernetes/workload_/gcloud/southamerica-west1/cluster-santiago?project=dryruns
kubeconfig entry generated for cluster-santiago.
NAME: cluster-santiago
LOCATION: southamerica-west1
MASTER_VERSION: 1.30.4-gke.1348000
MASTER_IP: 34.176.28.250
MACHINE_TYPE: e2-medium
NODE_VERSION: 1.30.4-gke.1348000
NUM_NODES: 3
STATUS: RUNNING
```



```shell
gcloud container clusters create cluster-iowa \
    --region us-central1 \
    --num-nodes 1 \
    --enable-autoscaling \
    --min-nodes 1 \
    --max-nodes 6 \
    --release-channel regular \
    --network=my-custom-vpc \
    --subnetwork=custom-subnet-iowa \
    --enable-ip-alias \
    --enable-network-policy \
    --enable-private-nodes \
    --enable-master-authorized-networks \
    --master-authorized-networks $(curl -s https://ifconfig.me)/32

```

Expected Output: 

```shell
Creating cluster cluster-iowa in us-central1... Cluster is being health-checked (Kubernetes Control Plane is healthy)...done.                                                                                                                                                                                                                                                                                                                                                                        
Created [https://container.googleapis.com/v1/projects/dryruns/zones/us-central1/clusters/cluster-iowa].
To inspect the contents of your cluster, go to: https://console.cloud.google.com/kubernetes/workload_/gcloud/us-central1/cluster-iowa?project=dryruns
kubeconfig entry generated for cluster-iowa.
NAME: cluster-iowa
LOCATION: us-central1
MASTER_VERSION: 1.30.4-gke.1348000
MASTER_IP: 34.171.130.3
MACHINE_TYPE: e2-medium
NODE_VERSION: 1.30.4-gke.1348000
NUM_NODES: 3
STATUS: RUNNING
```


2. Deploy Application to both clusters

```shell
./deploy.sh 
[+] Building 0.
...
The push refers to repository [southamerica-west1-docker.pkg.dev/dryruns/dr-testing/dr-testing]
e18e2beb0330: Pushed 
de7407064b33: Layer already exists 
b37263c91ce8: Layer already exists 
9c8af17347b2: Layer already exists 
365ccd918307: Layer already exists 
1bba629c69e9: Layer already exists 
139c1270acf1: Layer already exists 
4693057ce236: Layer already exists 
latest: digest: sha256:064b2978962d57c51bc27b9fe07ea0eacb8ee0b08a535ebf5508efd2ca70b0d1 size: 1992
Fetching cluster endpoint and auth data.
kubeconfig entry generated for cluster-santiago.
deployment.apps/nodejs-app created
service/nodejs-app-service created
Fetching cluster endpoint and auth data.
kubeconfig entry generated for cluster-iowa.
deployment.apps/nodejs-app created
service/nodejs-app-service created
```

3. Configure Multi-Regional Ingress

3.1 Reserve IP

```shell
gcloud compute addresses create gke-global-ip --global
Created [https://www.googleapis.com/compute/v1/projects/dryruns/global/addresses/gke-global-ip].
```

3.2 Register Clusters to an Anthos Fleet

Enable API.

```shell
gcloud services enable \
    gkehub.googleapis.com \
    multiclusteringress.googleapis.com \
    container.googleapis.com
Operation "operations/acat.p2-551624959543-b6210c9f-6764-4d17-b607-ac03e51db9b9" finished successfully.
```

Enable Workload Identity

```shell
gcloud container clusters update cluster-santiago \
    --region=southamerica-west1 \
    --workload-pool=$(gcloud config get-value project).svc.id.goog


    Updating cluster-santiago...done.                                                                                                                                                                                                                        
Updated [https://container.googleapis.com/v1/projects/dryruns/zones/southamerica-west1/clusters/cluster-santiago].
To inspect the contents of your cluster, go to: https://console.cloud.google.com/kubernetes/workload_/gcloud/southamerica-west1/cluster-santiago?project=dryruns

```

```shell
gcloud container clusters update cluster-iowa \
    --region=us-central1 \
    --workload-pool=$(gcloud config get-value project).svc.id.goog
Updating cluster-iowa...done.                                                                                                                                                                                                                                   
Updated [https://container.googleapis.com/v1/projects/dryruns/zones/us-central1/clusters/cluster-iowa].
To inspect the contents of your cluster, go to: https://console.cloud.google.com/kubernetes/workload_/gcloud/us-central1/cluster-iowa?project=dryruns

```

Review that configuration of WI was done correctly

```shell
gcloud container clusters describe cluster-santiago --region=southamerica-west1 --format="get(workloadIdentityConfig.workloadPool)"
gcloud container clusters describe cluster-iowa --region=us-central1 --format="get(workloadIdentityConfig.workloadPool)"

```

Join clusters into fleet: 

´´´shell
gcloud container fleet memberships register cluster-santiago \
    --gke-cluster=southamerica-west1/cluster-santiago \
    --enable-workload-identity


gcloud container fleet memberships register cluster-iowa \
    --gke-cluster=us-central1/cluster-iowa \
    --enable-workload-identity
´´´


Expected result: 

´´´shell
Waiting for membership to be created...done.                                                                                                                                                                                      
Finished registering to the Fleet.
´´´


Check fleet registry

´´´shell
gcloud container fleet memberships list
NAME: cluster-santiago
UNIQUE_ID: e11be610-eab1-4a27-8444-6c62a192befa
LOCATION: southamerica-west1

NAME: cluster-iowa
UNIQUE_ID: 45a2b410-985b-49f3-91a4-9864e976a439
LOCATION: us-central1
´´´

3.3 Setup Gateway API for Multicluster Ingress

´´´shell
kubectl config use-context gke_dryruns_us-central1_cluster-iowa
kubectl apply -k "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=v1.2.0"
customresourcedefinition.apiextensions.k8s.io/backendlbpolicies.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/backendtlspolicies.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/grpcroutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/referencegrants.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/tcproutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/tlsroutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/udproutes.gateway.networking.k8s.io created
´´´


´´´shell
kubectl config use-context gke_dryruns_southamerica-west1_cluster-santiago

kubectl apply -k "github.com/kubernetes-sigs/gateway-api/config/crd/experimental?ref=v1.2.0"
customresourcedefinition.apiextensions.k8s.io/backendlbpolicies.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/backendtlspolicies.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/grpcroutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/referencegrants.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/tcproutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/tlsroutes.gateway.networking.k8s.io created
customresourcedefinition.apiextensions.k8s.io/udproutes.gateway.networking.k8s.io created
´´´

Deploy the CRDs

´´´shell
kubectl config use-context gke_dryruns_southamerica-west1_cluster-santiago
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml

customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/grpcroutes.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/referencegrants.gateway.networking.k8s.io configured

´´´

´´´shell

kubectl config use-context gke_dryruns_us-central1_cluster-iowa
kubectl apply -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.2.0/standard-install.yaml
Switched to context "gke_dryruns_us-central1_cluster-iowa".
customresourcedefinition.apiextensions.k8s.io/gatewayclasses.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/gateways.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/grpcroutes.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/httproutes.gateway.networking.k8s.io configured
customresourcedefinition.apiextensions.k8s.io/referencegrants.gateway.networking.k8s.io configured

´´´

