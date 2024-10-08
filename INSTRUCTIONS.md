

1. Create clusters: 

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


2. List cluster contexts available

kubectl config get-contexts
CURRENT   NAME                                              CLUSTER                                           AUTHINFO                                          NAMESPACE
          gke_dryruns_southamerica-west1-a_cluster-1        gke_dryruns_southamerica-west1-a_cluster-1        gke_dryruns_southamerica-west1-a_cluster-1        
          gke_dryruns_southamerica-west1_cluster-1          gke_dryruns_southamerica-west1_cluster-1          gke_dryruns_southamerica-west1_cluster-1          
*         gke_dryruns_southamerica-west1_cluster-santiago   gke_dryruns_southamerica-west1_cluster-santiago   gke_dryruns_southamerica-west1_cluster-santiago   
          gke_dryruns_us-central1_cluster-iowa              gke_dryruns_us-central1_cluster-iowa              gke_dryruns_us-central1_cluster-iowa      




3. Install istio

3.1 Download Locally

curl -L https://istio.io/downloadIstio | sh -
cd istio-*
export PATH=$PWD/bin:$PATH

3.2 Update helm repos

kubectl config use-context gke_dryruns_southamerica-west1_cluster-santiago
helm repo add istio.io https://istio-release.storage.googleapis.com/charts
helm repo update


kubectl config use-context gke_dryruns_us-central1_cluster-iowa
helm repo add istio.io https://istio-release.storage.googleapis.com/charts
helm repo update


3.3 Create contexts in both clusters

kubectl create namespace istio-system --context=gke_dryruns_southamerica-west1_cluster-santiago
kubectl create namespace istio-system --context=gke_dryruns_us-central1_cluster-iowa


3.4 Install Istio Base and istiod with helm


kubectl config use-context gke_dryruns_southamerica-west1_cluster-santiago
helm install istio-base istio.io/base -n istio-system --kube-context gke_dryruns_southamerica-west1_cluster-santiago
helm install istiod istio.io/istiod -n istio-system --kube-context gke_dryruns_southamerica-west1_cluster-santiago


kubectl config use-context gke_dryruns_us-central1_cluster-iowa
helm install istio-base istio.io/base -n istio-system --kube-context gke_dryruns_us-central1_cluster-iowa
helm install istiod istio.io/istiod -n istio-system --kube-context gke_dryruns_us-central1_cluster-iowa


3.5 Enable sidecard injection

kubectl config use-context gke_dryruns_southamerica-west1_cluster-santiago
kubectl label namespace default istio-injection=enabled --context=gke_dryruns_southamerica-west1_cluster-santiago


kubectl config use-context gke_dryruns_us-central1_cluster-iowa
kubectl label namespace default istio-injection=enabled --context=gke_dryruns_us-central1_cluster-iowa



4. Deploy app in two clusters with ./deploy.sh script. 

5. Configure Global Load Balancer

5.1 Reserve global IP

gcloud compute addresses create istio-global-ip --global

5.2 Create backend services

gcloud compute backend-services create istio-backend-santiago \
    --global \
    --load-balancing-scheme=EXTERNAL \
    --protocol=HTTP


gcloud compute backend-services create istio-backend-iowa \
    --global \
    --load-balancing-scheme=EXTERNAL \
    --protocol=HTTP


5.3 Add the groups to the backend services. 

get them first with these commands: 

gcloud compute instance-groups list --filter="zone:southamerica-west1-*" --format="table(name,zone)"
NAME: gke-cluster-santiago-default-pool-6a0fc512-grp
ZONE: https://www.googleapis.com/compute/v1/projects/dryruns/zones/southamerica-west1-a

NAME: gke-cluster-santiago-default-pool-d3ac9b18-grp
ZONE: https://www.googleapis.com/compute/v1/projects/dryruns/zones/southamerica-west1-b

NAME: gke-cluster-santiago-default-pool-600d0f70-grp
ZONE: https://www.googleapis.com/compute/v1/projects/dryruns/zones/southamerica-west1-c


gcloud compute instance-groups list --filter="zone:us-central1-*" --format="table(name,zone)"
NAME: gke-cluster-iowa-default-pool-78f0eaa2-grp
ZONE: https://www.googleapis.com/compute/v1/projects/dryruns/zones/us-central1-a

NAME: gke-cluster-iowa-default-pool-ba304c41-grp
ZONE: https://www.googleapis.com/compute/v1/projects/dryruns/zones/us-central1-c

NAME: gke-cluster-iowa-default-pool-de9dd29f-grp
ZONE: https://www.googleapis.com/compute/v1/projects/dryruns/zones/us-central1-f



Add a healthcheck: 

gcloud compute health-checks create http istio-health-check \
    --port 32080


Create firewall rules to allow healthcheck: 

gcloud compute firewall-rules create allow-istio-health-check \
    --network=my-custom-vpc \
    --allow=tcp:32080 \
    --source-ranges=130.211.0.0/22,35.191.0.0/16 \
    --target-tags=gke-ingress



And then add the healthcheck to the backend: 

gcloud compute backend-services update istio-backend-santiago \
    --global --health-checks=istio-health-check


gcloud compute backend-services update istio-backend-iowa \
    --global --health-checks=istio-health-check


Now add them to the as this: 

gcloud compute backend-services add-backend istio-backend-santiago \
    --global \
    --instance-group=gke-cluster-santiago-default-pool-6a0fc512-grp \
    --instance-group-zone=southamerica-west1-a

gcloud compute backend-services add-backend istio-backend-santiago \
    --global \
    --instance-group=gke-cluster-santiago-default-pool-d3ac9b18-grp \
    --instance-group-zone=southamerica-west1-b

gcloud compute backend-services add-backend istio-backend-santiago \
    --global \
    --instance-group=gke-cluster-santiago-default-pool-600d0f70-grp \
    --instance-group-zone=southamerica-west1-c


gcloud compute backend-services add-backend istio-backend-iowa \
    --global \
    --instance-group=gke-cluster-iowa-default-pool-78f0eaa2-grp \
    --instance-group-zone=us-central1-a

gcloud compute backend-services add-backend istio-backend-iowa \
    --global \
    --instance-group=gke-cluster-iowa-default-pool-ba304c41-grp \
    --instance-group-zone=us-central1-c

gcloud compute backend-services add-backend istio-backend-iowa \
    --global \
    --instance-group=gke-cluster-iowa-default-pool-de9dd29f-grp \
    --instance-group-zone=us-central1-f


6. Configure the load balancer

gcloud compute url-maps create istio-url-map \
    --default-service=istio-backend-santiago

gcloud compute target-http-proxies create istio-http-proxy \
    --url-map=istio-url-map


gcloud compute forwarding-rules create istio-http-forwarding-rule \
    --global \
    --target-http-proxy=istio-http-proxy \
    --ports=80 \
    --address=istio-global-ip
