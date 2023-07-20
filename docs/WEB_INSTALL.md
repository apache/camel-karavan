## Install Karavan Web Application with CLI

### Requirements
1. minikube v1.30+ installed with `--driver=hyperkit`

### Installation
1. Start minikube
    ```
    minikube start --driver=hyperkit
    ```
2. Enable registry addon
    ```
    minikube addons enable registry
    ```
3. Start dashboard (optional)
    ```
    minikube dashboard
    ```
4. Install Karavan using CLI

    Option 1:
    ```
    mvn org.apache.maven.plugins:maven-dependency-plugin:3.0.2:copy -Dartifact=org.apache.camel.karavan:karavan-cli:3.21.0:jar -DoutputDirectory=. 

    java -jar karavan-cli-3.21.0.jar install --git-repository=$GIT_REPOSITORY --git-password=$GIT_TOKEN --git-username=$GIT_USERNAME  --node-port=30777
    ```
    Option 2:
    ```
    jbang org.apache.camel.karavan:karavan-cli:3.21.0 install --git-repository=$GIT_REPOSITORY --git-password=$GIT_TOKEN --git-username=$GIT_USERNAME  --node-port=30777
    ```
5. Get karavan service URL
    ```
    minikube service karavan --url --namespace karavan
    ```
   Use karavan URL to connect to the application
