## Install Karavan with CLI

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
4. Package karavan-cli
    ```
    mvn clean package
    ```
5. Install Karavan
    ```
    java -jar target/karavan-cli-VERSION.jar install --git-repository=$GIT_REPOSITORY --git-password=$GIT_TOKEN --git-username=$GIT_USERNAME  --node-port=30777
    ```
5. Get karavan service URL
    ```
    minikube service karavan --url --namespace karavan
    ```
   Use karavan URL to connect to the application
