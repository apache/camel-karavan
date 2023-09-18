#!/usr/bin/env bash
ENV _JAVA_OPTIONS="-Duser.home=$KARAVAN"

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

export CERT=$(cat /var/run/secrets/kubernetes.io/serviceaccount/service-ca.crt)
export TOKEN=$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)

sed -i 's/kubernetes-maven-plugin/openshift-maven-plugin/g' pom.xml

mvn package jib:build oc:resource oc:apply \
  -Djkube.namespace=${NAMESPACE} \
  -Djib.allowInsecureRegistries=true \
  -Djib.to.image=${IMAGE_REGISTRY}/${IMAGE_GROUP}/${PROJECT_ID}:${TAG} \
  -Djib.to.auth.username=${TOKEN} \
  -Djib.to.auth.password=${TOKEN}