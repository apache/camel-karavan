#!/usr/bin/env bash
ENV _JAVA_OPTIONS="-Duser.home=$KARAVAN"
export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

git config --global credential.helper 'cache --timeout=3600'
git_credential_fill() {
    echo url=$GIT_REPOSITORY
    echo username=$GIT_USERNAME
    echo password=$GIT_PASSWORD
}
git_credential_fill | git credential approve
git clone --depth 1 --branch $GIT_BRANCH $GIT_REPOSITORY $CODE_DIR

cd ${CODE_DIR}/${PROJECT_ID}

jbang -Dcamel.jbang.version=${CAMEL_VERSION} camel@apache/camel export --local-kamelet-dir=${KAMELETS_DIR}

sed -i 's/kubernetes-maven-plugin/openshift-maven-plugin/g' pom.xml

mvn package jib:build oc:resource oc:apply \
  -Djkube.namespace=${NAMESPACE} \
  -Djib.allowInsecureRegistries=true \
  -Djib.to.image=${IMAGE_REGISTRY}/${IMAGE_GROUP}/${PROJECT_ID}:${TAG} \
  -Djib.to.auth.username=${TOKEN} \
  -Djib.to.auth.password=${TOKEN}