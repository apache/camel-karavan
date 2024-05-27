#!/usr/bin/env bash

export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

git config --global credential.helper 'cache --timeout=3600'
git_credential_fill() {
    echo url=$GIT_REPOSITORY
    echo username=$GIT_USERNAME
    echo password=$GIT_PASSWORD
}
git_credential_fill | git credential approve
git clone --depth 1 --branch $GIT_BRANCH $GIT_REPOSITORY $CODE_DIR

cd $CODE_DIR/$PROJECT_ID

jbang -Dcamel.jbang.version=$CAMEL_VERSION camel@apache/camel export --local-kamelet-dir=$KAMELETS_DIR

mvn package jib:build k8s:resource k8s:apply \
  -Djkube.namespace=${NAMESPACE} \
  -Djib.allowInsecureRegistries=true \
  -Djib.to.image=${IMAGE_REGISTRY}/${IMAGE_GROUP}/${PROJECT_ID}:${TAG} \
  -Djib.to.auth.username=${IMAGE_REGISTRY_USERNAME} \
  -Djib.to.auth.password=${IMAGE_REGISTRY_PASSWORD}
  #  -Djib.from.platforms=linux/arm64 \
  #  -Djib.platform.architecture=arm64 \