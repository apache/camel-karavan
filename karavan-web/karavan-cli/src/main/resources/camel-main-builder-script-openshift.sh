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

jbang -Dcamel.jbang.version=$CAMEL_VERSION camel@apache/camel export --local-kamelet-dir=${KAMELETS_DIR}

export LAST_COMMIT=$(git rev-parse --short HEAD)
export DATE=$(date '+%Y%m%d%H%M%S')
export TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

mvn package jib:build oc:resource oc:apply \
  -Djkube.namespace=${NAMESPACE} \
  -Djib.allowInsecureRegistries=true \
  -Djib.to.image=${IMAGE_REGISTRY}/${IMAGE_GROUP}/$(inputs.params.project):${DATE} \
  -Djib.to.auth.username=${IMAGE_REGISTRY_USERNAME} \
  -Djib.to.auth.password=${IMAGE_REGISTRY_PASSWORD}  \
  --settings=$MAVEN_SETTINGS