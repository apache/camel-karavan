#!/bin/bash

echo "Set Generator pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-generator

echo "Set Application pom.xml version: $1";
mvn versions:set -DnewVersion=$1 -f karavan-app

echo "Set Core package.json extension version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-core

echo "Set Designer package.json version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-designer

echo "Set Application package.json extension version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-app/src/main/webapp/

echo "Set VSCode extension package.json version: $1";
yarn version --new-version $1 --no-commit --no-git-tag-version --cwd karavan-vscode

