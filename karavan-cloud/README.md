## Karavan cloud-native integration toolkit

### Architecture
![karavan-ipaas](../images/karavan-ipaas.png)

## OpenShift
### Requirements
1. OpenShift 4.10+ cluster up and running
2. OpenShift 4.10+ CLI installed

### Installation
1. Deploy Tekton Operator
    ```
    oc apply -f openshift/pipeline-operator.yaml
    ```
2. Create namespace
    ```
    oc apply -f openshift/karavan-namespace.yaml
    oc project karavan
    ```

3. Set git parameters
    Edit `karavan-secret.yaml` and set git repository, username and token

4. Deploy karavan
    ```
    oc apply -k openshift
    ```


## Minikube
### Requirements
1. minikube v1.25+ installed

### Installation
1. Install Tekton
    ```
    kubectl apply --filename https://storage.googleapis.com/tekton-releases/pipeline/latest/release.yaml
    ```
    Install Tekton Dashboard (optional)
    ```
    kubectl apply --filename https://storage.googleapis.com/tekton-releases/dashboard/latest/tekton-dashboard-release.yaml
    ```
    Set `disable-affinity-assistant` equals `true`
    ```
    kubectl edit configmap feature-flags -n tekton-pipelines
    ```
2. Create namespace
    ```
    kubectl apply -f base/karavan-namespace.yaml
    ```
3. Enable Registry
    ```
    minikube addons enable registry
    ```
3. Get IP address of internal registry
    ```
    kubectl -n kube-system get svc registry -o jsonpath='{.spec.clusterIP}'
    ```    
4. Set git parameters
    Edit `karavan-secret.yaml` and set git repository, username, token and Image Registry IP
    ```
    projects-git-repository: https://github.com/xxx
    projects-git-password: XXXX
    projects-git-username: XXXX
    projects-git-main: main
    kamelets-git-repository: https://github.com/zzz
    kamelets-git-password: zzz
    kamelets-git-username: zzz
    kamelets-git-main: main
    image-registry: X.X.X.X
    ```

4. Deploy karavan
    ```
    kubectl apply -k minikube --namespace karavan
    ```
6. Expose karavan application service
    ```
    minikube service karavan --url --namespace karavan
    ```
### Optional
1.  Access Tekton Dashboard 
    ```
    kubectl port-forward -n tekton-pipelines service/tekton-dashboard 9097:9097
    ```