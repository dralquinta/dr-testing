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

