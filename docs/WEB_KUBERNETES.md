## Karavan in Kubernetes

### Requirements
1. minikube v1.30+ installed with `--driver=hyperkit`

### Install on minikube
1. Start minikube
    ```
    minikube start
    ```
2. Enable registry addon
    ```
    minikube addons enable registry
    ```
3. Start dashboard (optional)
    ```
    minikube dashboard
    ```
4. Download [karavan-kubernetes](install/karavan-kubernetes) folder

5. Get registry IP and set it to `secrets.yaml`
    ```
    kubectl get service registry -n kube-system -o jsonpath="{.spec.clusterIP}"
    ```

6. Set Secrets for Git Repository and Container Image Registry connections in `secrets.yaml`

6. Install Karavan using kubectl
    ```
    kubectl create namespace karavan
    kubectl apply -k .
    ```
7. Expose karavan service
    ```
    minikube service karavan --url --namespace karavan
    ```

    Default username: `admin`, password: [**********](https://github.com/apache/camel-karavan/blob/3308dfb1df7a6559c027d236243de15e7481cd88/karavan-app/src/main/resources/application.properties#L109C19-L109C29)