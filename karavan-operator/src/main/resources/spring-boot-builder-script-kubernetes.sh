#!/usr/bin/env bash
CHECKOUT_DIR="/scripts"
KAMELETS_DIR="/scripts/kamelets"

if  [[ $GIT_REPOSITORY == https* ]] ;
then
    replacer=https://$GIT_PASSWORD@
    prefix=https://
    url="${GIT_REPOSITORY/$prefix/$replacer}"
    git clone --depth 1 --branch ${GIT_BRANCH} $url ${CHECKOUT_DIR}
else
    git clone --depth 1 --branch ${GIT_BRANCH} ${GIT_REPOSITORY} ${CHECKOUT_DIR}
fi

cd ${CHECKOUT_DIR}/$(inputs.params.project)

entrypoint -Dcamel.jbang.version=3.20.0 camel@apache/camel export --local-kamelet-dir=${KAMELETS_DIR}

export LAST_COMMIT=$(git rev-parse --short HEAD)
export DATE=$(date '+%Y%m%d%H%M%S')
export TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

if   [[ $DEPLOYMENT_ENVIRONMENT == 'AWS' ]];
then
    echo "Deploying in AWS Kubernetes"
    export TOKEN=$(cat /workspace/ecr_password.txt)
    /opt/mvnd/bin/mvnd package k8s:build k8s:push k8s:resource k8s:apply \
        -Pkubernetes \
        -Djkube.namespace=${NAMESPACE} \
        -Djkube.docker.push.username=AWS \
        -Djkube.docker.push.password=${TOKEN} \
        -Djkube.docker.skip.extendedAuth=true \
        -Djkube.docker.push.registry=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com \
        -Djkube.generator.name=$AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/${NAMESPACE}/$(inputs.params.project):${DATE}
else
    echo "Deploying in Kubernetes"
    export TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
    /opt/mvnd/bin/mvnd package k8s:build k8s:push k8s:resource k8s:apply \
        -Pkubernetes \
        -Djkube.namespace=${NAMESPACE} \
        -Djkube.docker.push.registry=${IMAGE_REGISTRY} \
        -Djkube.generator.name=${IMAGE_REGISTRY}/${NAMESPACE}/$(inputs.params.project):${DATE}
fi