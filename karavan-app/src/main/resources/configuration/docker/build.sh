#!/usr/bin/env bash
set -e

log_step "📥 Cloning repository"
git_auth_username_password
git clone --filter=blob:none --branch ${GIT_BRANCH} ${GIT_REPOSITORY} ${CODE_DIR}

log_step "⚙️ Configuring Environment"
JIB_MAVEN_VERSION=3.5.2
JIB_ARGS=(
  "-Djib.allowInsecureRegistries=true"
  "-Djib.from.image=registry.access.redhat.com/hi/openjdk:21.0.11"
  "-Djib.container.creationTime=USE_CURRENT_TIMESTAMP"
  "-Djib.container.labels=org.apache.camel.karavan/type=packaged,org.apache.camel.karavan/projectId=$PROJECT_ID"
  "-Djib.to.image=$IMAGE_REGISTRY/$IMAGE_GROUP/$PROJECT_ID:$TAG"
  "-Djib.to.auth.username=$IMAGE_REGISTRY_USERNAME"
  "-Djib.to.auth.password=$IMAGE_REGISTRY_PASSWORD"
)

log_step "📂️ Prepare files"
cd "$CODE_DIR"/"$PROJECT_ID"

log_step "📦 Exporting project into Maven"
# TODO: --ignore-loading-error until https://issues.apache.org/jira/browse/CAMEL-24410
java -cp "$KARAVAN_LIB/*" KaravanDevMode export * --local-kamelet-dir=$KAMELETS_DIR --dir=.export --ignore-loading-error

log_step "🛠️ Build "
mvn package "com.google.cloud.tools:jib-maven-plugin:${JIB_MAVEN_VERSION}:build" -f .export "${JIB_ARGS[@]}" --no-transfer-progress

log_step "✅ Process Complete"