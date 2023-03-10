## Karavan on Minikube

### Requirements
1. minikube v1.25+ installed

### Installation
1. Install Tekton
    ```
    kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
    ```
    Install Tekton Dashboard (optional)
    ```
    kubectl apply --filename https://storage.googleapis.com/tekton-releases/dashboard/latest/release.yaml
    ```
    Set `disable-affinity-assistant` equals `true`
    ```
    kubectl edit configmap feature-flags -n tekton-pipelines
    ```
2. Install Operator Lifecycle Management
    ```
    curl -sL https://github.com/operator-framework/operator-lifecycle-manager/releases/download/v0.22.0/install.sh | bash -s v0.22.0
    ```
    or
    ```
    operator-sdk olm install latest
    ```
3. Install karavan operator
    ```
    kubectl create -f https://operatorhub.io/install/camel-karavan-operator.yaml
    ```
    Check operator installation status (PHASE=Succeeded)
    ```
    kubectl get csv -n operators
    ```
4. Enable Registry addons
    ```
    minikube addons enable registry
    ```
5. Create namespace
    ```
    kubectl create namespace karavan
    ```
6. Get IP address of internal registry
    ```
    kubectl -n kube-system get svc registry -o jsonpath='{.spec.clusterIP}'
    ```    
7. Edit Karavan Secret `minikube/karavan-secret.yaml` according to enviroment and apply
    ```
    kubectl apply -f minikube/karavan-secret.yaml -n karavan
    ```
8. Create Karavan Instance and apply
    ```
    kubectl apply -f minikube/karavan.yaml -n karavan
    ```
9. Expose karavan application service
    ```
    minikube service karavan --url --namespace karavan
    ```

### Optional
1.  Access Tekton Dashboard 
    ```
    kubectl port-forward -n tekton-pipelines service/tekton-dashboard 9097:9097
    ```