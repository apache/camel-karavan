#!/bin/bash

echo "Set Generator pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-generator

echo "Set Application pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-app

npm config set sign-git-tag false
npm config set commit-hooks false
npm config set workspaces-update false
npm config set allow-same-version true

echo "Set Core package.json extension version: $1";
npm version --new-version $1 --prefix   karavan-core

echo "Set Designer package.json version: $1";
npm version --new-version $1 --prefix  karavan-designer

echo "Set Application package.json extension version: $1";
npm version --new-version $1 --prefix  karavan-app/src/main/webui/

echo "Set VSCode extension package.json version: $1";
npm version --new-version $1 --prefix  karavan-vscode

echo "Set README.md camel.jbang.version=$1";
sed -i.bak 's/camel.jbang.version=[0-9].[0-9].[0-9]/camel.jbang.version='"$1"'/g' karavan-vscode/README.md 

echo "Set VSCode extension package.json version: $1";
npm version --new-version $1 --prefix  karavan-space

echo "Set Github Workflow Devmode TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/docker-devmode.yml 

echo "Set Github Workflow App TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/app.yml 

echo "Set Github Workflow App TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/app-oidc.yml 

echo "Set Github Workflow Vscode TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/vscode.yml 

echo "Set application.properties karavan.version=$1";
sed -i.bak 's/karavan.version.*/karavan.version='"$1"'/g' karavan-app/src/main/resources/application.properties 

echo "Set application.properties camel-karavan-devmode:$1";
sed -i.bak 's/camel-karavan-devmode.*/camel-karavan-devmode:'"$1"'/g' karavan-app/src/main/resources/application.properties 

echo "Set docker-compose-gitea.yaml camel-karavan:$1";
sed -i.bak 's/camel-karavan.*/camel-karavan:'"$1"'/g' docs/install/karavan-docker/docker-compose-gitea.yaml 

echo "Set docker-compose.yaml camel-karavan:$1";
sed -i.bak 's/camel-karavan.*/camel-karavan:'"$1"'/g' docs/install/karavan-docker/docker-compose.yaml 

echo "Set VSCODE_HOWTO.md camel.jbang.version=$1";
sed -i.bak 's/camel.jbang.version=[0-9].[0-9].[0-9]/camel.jbang.version='"$1"'/g' docs/VSCODE_HOWTO.md 

echo "Set deployment.yaml camel-karavan-devmode:$1";
sed -i.bak 's/camel-karavan-devmode:[0-9].[0-9].[0-9]/camel-karavan-devmode:'"$1"'/g' docs/install/karavan-kubernetes/deployment.yaml

echo "Set deployment.yaml camel-karavan:$1";
sed -i.bak 's/camel-karavan:[0-9].[0-9].[0-9]/camel-karavan:'"$1"'/g' docs/install/karavan-kubernetes/deployment.yaml

echo "Set kustomization.yaml camel-karavan:$1";
sed -i.bak 's/app.kubernetes.io\/version.*/app.kubernetes.io\/version: "'"$1"'"/g' docs/install/karavan-kubernetes/kustomization.yaml