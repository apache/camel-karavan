#!/usr/bin/env bash
CHECKOUT_DIR="/scripts"
KAMELETS_DIR="/scripts/kamelets"

if  [[ $GIT_REPOSITORY == https* ]] ;
then
    replacer=https://$GIT_USERNAME:$GIT_PASSWORD@
    prefix=https://
    url="${GIT_REPOSITORY/$prefix/$replacer}"
    git clone --depth 1 --branch ${GIT_BRANCH} $url ${CHECKOUT_DIR}
else
    git clone --depth 1 --branch ${GIT_BRANCH} ${GIT_REPOSITORY} ${CHECKOUT_DIR}
fi

cd ${CHECKOUT_DIR}/$(inputs.params.project)

entrypoint -Dcamel.jbang.version=$CAMEL_VERSION camel@apache/camel export --local-kamelet-dir=${KAMELETS_DIR}

export LAST_COMMIT=$(git rev-parse --short HEAD)
export DATE=$(date '+%Y%m%d%H%M%S')
export TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

mvn package k8s:build k8s:push k8s:resource k8s:apply \
  -Pkubernetes \
  -Djkube.namespace=${NAMESPACE} \
  -Djkube.docker.push.registry=${IMAGE_REGISTRY} \
  -Djkube.docker.username=${IMAGE_REGISTRY_USERNAME} \
  -Djkube.docker.password=${IMAGE_REGISTRY_PASSWORD} \
  -Djkube.generator.name=${IMAGE_REGISTRY}/${IMAGE_GROUP}/$(inputs.params.project):${DATE} \
  --settings=$MAVEN_SETTINGS