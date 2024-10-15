# Setting up Multi-cluster Ingress with Anthos Service Mesh

The following set of instructions explain how to set up a Multi-Cluster Mesh using Anthos Service Mesh (ASM)

## Architecture

The following diagram shows end goal of configuration

![](./img/Service-Mesh.jpg)

The configuration will allow an external global application load balancer, enter the application served inside two regional clusters, via an ingress gateway which later will be routed to an envoy proxy embedded inside Istio Side Car, injected inside the deployment pod. 

For mode details on how this works, refer to the following [video](https://www.youtube.com/watch?v=UuFR_FztLK0) 



## Instructions

1. Open Cloud Shell and set up the following variables in as much terminals you will use. 

```shell
export PROJECT_ID=$(gcloud config get-value project)
export CLUSTER_NAME_SA="cluster-santiago"
export CLUSTER_NAME_IOWA="cluster-iowa"
export REGION_SA="southamerica-west1"
export REGION_IOWA="us-central1"
export SUBNET_SA="custom-subnet-santiago"
export SUBNET_IOWA="custom-subnet-iowa"
```

Adjust the variables to whatever applies to your case. In this case, the setup is two clusters, one located in southamerica-west1 and the other in us-central1. 