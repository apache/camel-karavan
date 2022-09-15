#!/bin/bash

# echo "Set Generator pom.xml version: $1";
# mvn versions:set -DnewVersion=$1 -f karavan-generator

# echo "Set Application pom.xml version: $1";
# mvn versions:set -DnewVersion=$1 -f karavan-app

# echo "Set Core package.json extension version: $1";
# yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-core

# echo "Set Designer package.json version: $1";
# yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-designer

# echo "Set Application package.json extension version: $1";
# yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-app/src/main/webapp/

# echo "Set VSCode extension package.json version: $1";
# yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-vscode

echo "Set Github Workflow Builder TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/builder.yml 

echo "Set Github Workflow App TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/app.yml 

echo "Set application.properties karavan.version=$1";
sed -i.bak 's/karavan.version.*/karavan.version='"$1"'/g' karavan-app/src/main/resources/application.properties 

echo "Set Deployment manifests version $1";
sed -i.bak 's/camel-karavan.*/camel-karavan:'"$1"'/g' karavan-cloud/openshift/karavan-app-public.yaml
sed -i.bak 's/camel-karavan-basic.*/camel-karavan-basic:'"$1"'/g' karavan-cloud/openshift/karavan-app-basic.yaml
sed -i.bak 's/camel-karavan-oidc.*/camel-karavan-oidc:'"$1"'/g' karavan-cloud/openshift/karavan-app-oidc.yaml

echo "Set Tekton Task manifest version $1";
sed -i.bak 's/camel-karavan-builder.*/camel-karavan-builder:'"$1"'/g' karavan-cloud/openshift/karavan-quarkus-task.yaml