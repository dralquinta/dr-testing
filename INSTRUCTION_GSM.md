
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

```shell
gcloud container clusters create $CLUSTER_NAME_SA \
    --region $REGION_SA \
    --enable-ip-alias \
    --network "projects/$PROJECT_ID/global/networks/my-custom-vpc" \
    --subnetwork $SUBNET_SA \
    --machine-type "e2-medium" \
    --num-nodes 2 \
    --workload-pool="$PROJECT_ID.svc.id.goog"
```


```shell
gcloud container clusters create $CLUSTER_NAME_IOWA \
    --region $REGION_IOWA \
    --enable-ip-alias \
    --network "projects/$PROJECT_ID/global/networks/my-custom-vpc" \
    --subnetwork $SUBNET_IOWA \
    --machine-type "e2-medium" \
    --num-nodes 2 \
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


Install ASM in both clusters

```shell
asmcli install \
    --project_id $PROJECT_ID \
    --cluster_name $CLUSTER_NAME_SA \
    --cluster_location $REGION_SA \
    --fleet_id $PROJECT_ID \
    --output_dir ./asm-output \
    --enable_all \
    --ca mesh_ca \
    --enable_gcp_components \
    --option legacy-default-ingressgateway 
```

```shell
asmcli install \
    --project_id $PROJECT_ID \
    --cluster_name $CLUSTER_NAME_IOWA \
    --cluster_location $REGION_IOWA \
    --fleet_id $PROJECT_ID \
    --output_dir ./asm-output \
    --enable_all \
    --ca mesh_ca \
    --enable_gcp_components \
    --option legacy-default-ingressgateway
```

Enable Istio Proxy Sidecar injection: 

```shell
kubectl label namespace default istio-injection=enabled --context=gke_${PROJECT_ID}_${REGION_SA}_${CLUSTER_NAME_SA}
```

```shell
kubectl label namespace default istio-injection=enabled --context=gke_${PROJECT_ID}_${REGION_IOWA}_${CLUSTER_NAME_IOWA}
```


Deploy sample app to both clusters.

This will also deploy gateway and virutalservice configurations

```shell
./deploy.sh
```

Create namespace for istio-gateway

```shell
kubectl create namespace istio-gateway --context=gke_${PROJECT_ID}_${REGION_SA}_${CLUSTER_NAME_SA}
```

```shell
kubectl create namespace istio-gateway --context=gke_${PROJECT_ID}_${REGION_IOWA}_${CLUSTER_NAME_IOWA}
```

Deploy Gateway and Virtual Service Configuration

```shell
kubectl apply -f istio/app-gateway.yaml --context=gke_${PROJECT_ID}_${REGION_SA}_${CLUSTER_NAME_SA}
```

```shell
kubectl apply -f istio/app-gateway.yaml --context=gke_${PROJECT_ID}_${REGION_IOWA}_${CLUSTER_NAME_IOWA}
```


Patch the istio-ingressgateways to be a NEG

```shell
kubectl patch svc istio-ingressgateway -n istio-system --context=gke_${PROJECT_ID}_${REGION_SA}_${CLUSTER_NAME_SA} -p \
'{"spec": {"type": "NodePort"}, "metadata": {"annotations": {"cloud.google.com/neg": "{\"exposed_ports\":{\"80\":{\"name\": \"istio-http-santiago\"}}}"}}}'

```

```shell
kubectl patch svc istio-ingressgateway -n istio-system --context=gke_${PROJECT_ID}_${REGION_IOWA}_${CLUSTER_NAME_IOWA} -p \
'{"spec": {"type": "NodePort"}, "metadata": {"annotations": {"cloud.google.com/neg": "{\"exposed_ports\":{\"80\":{\"name\": \"istio-http-iowa\"}}}"}}}'

```


NOTE: 

In case patching to Load Balancer back is required, use: 

```shell
kubectl patch svc istio-ingressgateway -n istio-system --context=gke_${PROJECT_ID}_${REGION_XXX}_${CLUSTER_NAME_XXX} -p '{"spec": {"type": "LoadBalancer"}}'
```


NEG Healthcheck: 

```shell
gcloud compute backend-services get-health istio-backend --global
```

Create Healthcheck

```shell
gcloud compute health-checks create http istio-health-check \
    --port 15021
```

Update the URI of the healthcheck

```shell
gcloud compute health-checks update http istio-health-check \
    --request-path="/healthz/ready"

```

Create Firewall Rule

```shell
gcloud compute firewall-rules create allow-istio-health-check \
    --network=my-custom-vpc \
    --allow=tcp:15021,tcp:15020,tcp:31859,tcp:32080,tcp:31314 \
    --source-ranges=0.0.0.0/0,130.211.0.0/22,35.191.0.0/16 \
    --target-tags=all
```
Create the L7 Load Balancer using the console

See: https://medium.com/niveus-solutions/deploying-anthos-service-mesh-on-private-gke-and-configuring-asm-with-cloud-load-balancing-e47d76c98978 



NOTE: 

if issues arises with 404 on front end, check the routing on istio, by using: 

```shell
istioctl proxy-config routes <istio-ingressgateway-pod-name> --context=gke_${PROJECT_ID}_${REGION_XX}_${CLUSTER_NAME_XX} -n istio-system

```
