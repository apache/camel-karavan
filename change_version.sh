#!/bin/bash

echo "Set Generator pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-generator

echo "Set Application pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-app

echo "Set Operator pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-operator

echo "Set Core package.json extension version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-core

echo "Set Designer package.json version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-designer

echo "Set Application package.json extension version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-app/src/main/webui/

echo "Set VSCode extension package.json version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-vscode

echo "Set Github Workflow Builder TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/builder.yml 

echo "Set Github Workflow App TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/app.yml 

echo "Set Github Workflow App TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/operator.yml  


echo "Set application.properties karavan.version=$1";
sed -i.bak 's/karavan.version.*/karavan.version='"$1"'/g' karavan-operator/src/main/resources/application.properties 
sed -i.bak 's/quarkus.container-image.tag.*/quarkus.container-image.tag='"$1"'/g' karavan-operator/src/main/resources/application.properties 
sed -i.bak 's/VERSION ?=.*/VERSION ?='"$1"'/g' karavan-operator/Makefile

echo "Set application.properties karavan.version=$1";
sed -i.bak 's/karavan.version.*/karavan.version='"$1"'/g' karavan-app/src/main/resources/application.properties 