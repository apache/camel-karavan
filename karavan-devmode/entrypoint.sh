#!/bin/bash

# Entrypoint script for running Karavan in different modes

# Function to print visually separated log headers
log_step() {
    echo ""
    echo "========================================================================"
    echo "$1"
    echo "========================================================================"
}
export -f log_step

# Function to determine KARAVAN_HOST based on the environment (K8s vs Docker)
determine_host() {
    log_step "🌐 Determining Platform Host Environment"
    local k8s_namespace_file="/var/run/secrets/kubernetes.io/serviceaccount/namespace"

    if [[ -f "$k8s_namespace_file" ]]; then
        export NAMESPACE=$(cat "$k8s_namespace_file")
        export KARAVAN_HOST="karavan.$NAMESPACE"
        echo "✅ Kubernetes environment detected. KARAVAN_HOST set to: $KARAVAN_HOST"
    else
        export KARAVAN_HOST="karavan:8080"
        echo "🐳 Docker environment detected. KARAVAN_HOST set to: $KARAVAN_HOST"
    fi
}
export -f determine_host

# Function to set git credentials
git_auth_username_password() {
    log_step "🔐 Configure Git Credentials"
    git config --global credential.helper 'cache --timeout=3600'
    git_credential_fill() {
        echo url=$GIT_REPOSITORY
        echo username=$GIT_USERNAME
        echo password=$GIT_PASSWORD
    }
    git_credential_fill | git credential approve
}
export -f git_auth_username_password

determine_host

if [[ "$RUN_IN_COMPILE_MODE" == "true" ]]; then
    log_step "👷Running compiled..."
    java $JAVA_OPTS -cp "$KARAVAN_LIB/*" KaravanDevMode export --local-kamelet-dir="$KAMELETS_DIR" --dir=.export
    mvn compile dependency:copy-dependencies -f .export -DoutputDirectory=target/lib
    export BASE_PACKAGE_SCAN=$(grep -oP '^camel\.main\.basePackageScan=\K.*' .export/src/main/resources/application.properties)
    java $JAVA_OPTS -cp ".export/target/lib/*:.export/target/classes" "$BASE_PACKAGE_SCAN".CamelApplication
elif [[ "$RUN_IN_BUILD_MODE" == "true" ]]; then
    log_step "📦 Packaging..."
    secure_ssh_keys
    log_step "🗂️ Preparing build.sh script"
    java $JAVA_OPTS -cp "$KARAVAN_LIB/*" KaravanDevMode fetchBuildScriptFromPlatform
    /karavan/builder/build.sh
else
    log_step "🚀 Karavan Developer Mode for $PROJECT_ID"
    java $JAVA_OPTS -cp "$KARAVAN_LIB/*" KaravanDevMode run --source-dir="$CODE_DIR" --logging-color=true --console $VERBOSE_OPTION
fi