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

mvn package \
  -Dquarkus.container-image.build=true \
  -Dquarkus.container-image.push=true \
  -Dquarkus.container-image.insecure=true \
  -Dquarkus.container-image.username=${IMAGE_REGISTRY_USERNAME} \
  -Dquarkus.container-image.password=${IMAGE_REGISTRY_PASSWORD} \
  -Dquarkus.container-image.registry=${IMAGE_REGISTRY} \
  -Dquarkus.container-image.builder=jib \
  -Dquarkus.kubernetes.deploy=true \
  -Dquarkus.kubernetes.deployment-target=kubernetes \
  -Dquarkus.kubernetes.add-version-to-label-selectors=false \
  -Dquarkus.kubernetes.labels.\"app\"=$(inputs.params.project) \
  -Dquarkus.kubernetes.labels.\"app.kubernetes.io/runtime\"=camel \
  -Dquarkus.container-image.group=${IMAGE_GROUP} \
  -Dquarkus.container-image.tag=${DATE} \
  --settings=$MAVEN_SETTINGS