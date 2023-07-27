## Karavan demo on OpenShift

Karavan cloud-native integration toolkit demo on OpenShift with Gitea repository

### Requirements
1. OpenShift 4.10+ cluster up and running
2. OpenShift 4.10+ CLI installed

### Installation

#### Install Operators
1. Install Gitea Operator
    ```
    oc apply -k https://github.com/rhpds/gitea-operator/OLMDeploy
    ```
2. Install Tekton Operator if it is not installed yet
    ```
    oc apply -f https://raw.githubusercontent.com/apache/camel-karavan/main/docs/openshift/pipeline-operator.yaml
    ```
    
    Wait until operators are ready (Status: Succeeded)
    
3. Install Karavan Operator
    ```
    oc apply -f https://raw.githubusercontent.com/apache/camel-karavan/main/docs/openshift/karavan-operator.yaml
    ```
    Wait until operator is ready (Status: Succeeded)

    ![operators-ready](../images/operators-ready.png)

#### Install applications
1. Create namespace
    ```
    oc new-project karavan
    ```
    If cluster has LimitRange for karavan namespace, remove LimitRange for the namespace
    
2. Create Gitea instance
    ```
    oc apply -f https://raw.githubusercontent.com/apache/camel-karavan/main/docs/openshift/gitea.yaml -n karavan
    ```

    Wait until Gitea is ready

    ![gitea-ready](../images/gitea-ready.png)

3. Create Karavan Secret
    ```
    oc apply -f https://raw.githubusercontent.com/apache/camel-karavan/main/docs/openshift/karavan-secret.yaml -n karavan
    ```
4. Create Karavan Instance

    ```
    oc apply -f https://raw.githubusercontent.com/apache/camel-karavan/main/docs/openshift/karavan.yaml -n karavan
    ```

    Wait until karavan Karavan is ready and open Karavan
    ```
    open http://karavan-karavan.$(oc get ingresses.config.openshift.io cluster  -o template --template '{{.spec.domain}}') 
    ```
