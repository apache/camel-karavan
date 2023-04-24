#!/bin/sh
export CHECKOUT_DIR="/scripts/code"
export KAMELETS_DIR="/scripts/code/kamelets"

if  [[ $GIT_REPOSITORY == https* ]] ;
then
    replacer=https://$GIT_TOKEN@
    prefix=https://
    url="${GIT_REPOSITORY/$prefix/$replacer}"
    git clone --depth 1 --branch $GIT_BRANCH $url $CHECKOUT_DIR
else
    git clone --depth 1 --branch $GIT_BRANCH $GIT_REPOSITORY $CHECKOUT_DIR
fi

cd $CHECKOUT_DIR/$PROJECT
jbang -Dcamel.jbang.version=$CAMEL_VERSION camel run * --console --local-kamelet-dir=$KAMELETS_DIR