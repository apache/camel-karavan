#!/bin/bash

docker run -it --rm \
  --name karavan \
  --network karavan \
  -p 8080:8080 \
  -p 5005:5005 \
  -p 5173:5173 \
  -v "$HOME/.m2":/m2-cache \
  -v "$(pwd)":/usr/src/app \
  -v /usr/src/app/target \
  -v /usr/src/app/src/main/webui/node_modules \
  -w /usr/src/app \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -e QUARKUS_ANALYTICS_DISABLED=true \
  maven:3.9-eclipse-temurin-25 \
  mvn quarkus:dev \
    -Dquarkus.http.host=0.0.0.0 \
    -Dmaven.repo.local=/m2-cache/repository \
    "$@"