#!/bin/bash

# Project configuration
PROJECT_ID="dryruns"
IMAGE_NAME="dr-testing"
GCR_REPO="southamerica-west1-docker.pkg.dev/${PROJECT_ID}/${IMAGE_NAME}"
GKE_PRIMARY_CLUSTER_NAME="cluster-santiago"
GKE_SECONDARY_CLUSTER_NAME="cluster-iowa"

PRIMARY_REGION="southamerica-west1"
SECONDARY_REGION="us-central1"




#DEPLOY TO PRIMARY REGION
# Configure kubectl to connect to your GKE cluster
gcloud container clusters get-credentials ${GKE_PRIMARY_CLUSTER_NAME} --region ${PRIMARY_REGION} --project ${PROJECT_ID}
# Deploy to GKE
kubectl delete -f ./kubernetes/deploy.yaml


#DEPLOY TO SECONDARY REGION
# Configure kubectl to connect to your GKE cluster
gcloud container clusters get-credentials ${GKE_SECONDARY_CLUSTER_NAME} --region ${SECONDARY_REGION} --project ${PROJECT_ID}
# Deploy to GKE
kubectl delete -f ./kubernetes/deploy.yaml

