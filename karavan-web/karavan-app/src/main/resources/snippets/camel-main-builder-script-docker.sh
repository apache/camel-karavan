#!/usr/bin/env bash
CHECKOUT_DIR="/scripts"
KAMELETS_DIR="/scripts/kamelets"

if  [[ ${GIT_REPOSITORY} == https* ]] ;
then
    replacer=https://${GIT_USERNAME}:${GIT_PASSWORD}@
    prefix=https://
    url="${GIT_REPOSITORY/$prefix/$replacer}"
    echo url
    git clone --depth 1 --branch ${GIT_BRANCH} $url ${CHECKOUT_DIR}
elif [[ ${GIT_REPOSITORY} == http* ]] ;
then
  replacer=http://${GIT_USERNAME}:${GIT_PASSWORD}@
      prefix=http://
      url="${GIT_REPOSITORY/$prefix/$replacer}"
      echo url
      git clone --depth 1 --branch ${GIT_BRANCH} $url ${CHECKOUT_DIR}
else
    git clone --depth 1 --branch ${GIT_BRANCH} ${GIT_REPOSITORY} ${CHECKOUT_DIR}
fi

cd ${CHECKOUT_DIR}/${PROJECT_ID}

jbang -Dcamel.jbang.version=${CAMEL_VERSION} camel@apache/camel export --local-kamelet-dir=${KAMELETS_DIR}

export LAST_COMMIT=$(git rev-parse --short HEAD)
export DATE=$(date '+%Y%m%d%H%M%S')

mvn package jib:build \
  -Djib.allowInsecureRegistries=true \
  -Djib.to.image=${IMAGE_REGISTRY}/${IMAGE_GROUP}/${PROJECT_ID}:${DATE} \
  -Djib.to.auth.username=${IMAGE_REGISTRY_USERNAME} \
  -Djib.to.auth.password=${IMAGE_REGISTRY_PASSWORD}