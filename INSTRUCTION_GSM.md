
Export the following variables: 


```shell
export PROJECT_ID=$(gcloud config get-value project)
export CLUSTER_NAME_SA="cluster-santiago"
export CLUSTER_NAME_IOWA="cluster-iowa"
export REGION_SA="southamerica-west1"
export REGION_IOWA="us-central1"
export SUBNET_SA="custom-subnet-santiago"
export SUBNET_IOWA="custom-subnet-iowa"
```


Create clusters: 

``shell
gcloud container clusters create $CLUSTER_NAME_SA \
    --region $REGION_SA \
    --enable-ip-alias \
    --network "projects/$PROJECT_ID/global/networks/my-custom-vpc" \
    --subnetwork $SUBNET_SA \
    --machine-type "e2-medium" \
    --num-nodes 1 \
    --workload-pool="$PROJECT_ID.svc.id.goog"
```


```shell
gcloud container clusters create $CLUSTER_NAME_IOWA \
    --region $REGION_IOWA \
    --enable-ip-alias \
    --network "projects/$PROJECT_ID/global/networks/my-custom-vpc" \
    --subnetwork $SUBNET_IOWA \
    --machine-type "e2-medium" \
    --num-nodes 1 \
    --workload-pool="$PROJECT_ID.svc.id.goog"
```


Get credentials for both clusters

```shell
gcloud container clusters get-credentials $CLUSTER_NAME_SA --region $REGION_SA
gcloud container clusters get-credentials $CLUSTER_NAME_IOWA --region $REGION_IOWA
```


Install ASM

```shell
curl https://storage.googleapis.com/csm-artifacts/asm/asmcli > asmcli
chmod +x asmcli
sudo mv asmcli /usr/bin
```


Install ASM in both clusters

```shell
asmcli install \
    --project_id $PROJECT_ID \
    --cluster_name $CLUSTER_NAME_SA \
    --cluster_location $REGION_SA \
    --fleet_id $PROJECT_ID \
    --output_dir ./asm-output \
    --enable_all
```

```shell
asmcli install \
    --project_id $PROJECT_ID \
    --cluster_name $CLUSTER_NAME_IOWA \
    --cluster_location $REGION_IOWA \
    --fleet_id $PROJECT_ID \
    --output_dir ./asm-output \
    --enable_all
```


Enable workload Identity

```shell
gcloud container clusters update $CLUSTER_NAME_SA --region $REGION_SA --workload-pool="$PROJECT_ID.svc.id.goog"
gcloud container clusters update $CLUSTER_NAME_IOWA --region $REGION_IOWA --workload-pool="$PROJECT_ID.svc.id.goog"

```

Register Clusters with fleet

```shell
gcloud container fleet memberships register $CLUSTER_NAME_SA \
    --gke-cluster=$REGION_SA/$CLUSTER_NAME_SA \
    --enable-workload-identity
```

```shell
gcloud container fleet memberships register $CLUSTER_NAME_IOWA \
    --gke-cluster=$REGION_IOWA/$CLUSTER_NAME_IOWA \
    --enable-workload-identity
```

Deploy sample app to both clusters.

This will also deploy gateway and virutalservice configurations

```shell
./deploy.sh
```

