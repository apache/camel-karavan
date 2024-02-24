#!/usr/bin/env bash

if  [[ ${GIT_REPOSITORY} == https* ]] ;
then
    replacer=https://${GIT_USERNAME}:${GIT_PASSWORD}@
    prefix=https://
    url="${GIT_REPOSITORY/$prefix/$replacer}"
    git clone --depth 1 --branch ${GIT_BRANCH} $url ${CODE_DIR}
elif [[ ${GIT_REPOSITORY} == http* ]] ;
then
  replacer=http://${GIT_USERNAME}:${GIT_PASSWORD}@
      prefix=http://
      url="${GIT_REPOSITORY/$prefix/$replacer}"
      git clone --depth 1 --branch ${GIT_BRANCH} $url ${CODE_DIR}
else
    git clone --depth 1 --branch ${GIT_BRANCH} ${GIT_REPOSITORY} ${CODE_DIR}
fi

cd ${CODE_DIR}/${PROJECT_ID}

jbang -Dcamel.jbang.version=${CAMEL_VERSION} camel@apache/camel export --local-kamelet-dir=${KAMELETS_DIR}

mvn package jib:build \
  -Djib.allowInsecureRegistries=true \
  -Djib.to.image=${IMAGE_REGISTRY}/${IMAGE_GROUP}/${PROJECT_ID}:${TAG} \
  -Djib.to.auth.username=${IMAGE_REGISTRY_USERNAME} \
  -Djib.to.auth.password=${IMAGE_REGISTRY_PASSWORD}
