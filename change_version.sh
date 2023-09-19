#!/bin/bash

echo "Set Generator pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-generator

echo "Set Web pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-web

echo "Set Application pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-web/karavan-app

echo "Set Installer pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-web/karavan-installer

echo "Set Core package.json extension version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-core

echo "Set Designer package.json version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-designer

echo "Set Application package.json extension version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-web/karavan-app/src/main/webui/

echo "Set VSCode extension package.json version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-vscode

echo "Set VSCode extension package.json version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-space

echo "Set Github Workflow Runner TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/docker-devmode.yml 

echo "Set Github Workflow App TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/app.yml 

echo "Set Github Workflow App TAG version: $1";
sed -i.bak 's/TAG:.*/TAG: '"$1"'/g' .github/workflows/installer.yml

echo "Set application.properties karavan.version=$1";
sed -i.bak 's/karavan.version.*/karavan.version='"$1"'/g' karavan-web/karavan-app/src/main/resources/application.properties 