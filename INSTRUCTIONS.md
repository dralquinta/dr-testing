

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

gcloud compute addresses create istio-global-ip --global
