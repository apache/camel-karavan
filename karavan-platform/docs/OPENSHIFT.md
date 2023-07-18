## Karavan on OpenShift

Karavan cloud-native integration toolkit demo on OpenShift with existing repository

### Requirements
1. OpenShift 4.10+ cluster up and running
2. OpenShift 4.10+ CLI installed
3. Git repositories for projects and custom kamelets 

### Installation
1. Install Tekton Operator
    ```
    oc apply -f https://raw.githubusercontent.com/apache/camel-karavan/main/karavan-cloud/openshift/pipeline-operator.yaml
    ```
2. Install Karavan Operator
    ```
    oc apply -f https://raw.githubusercontent.com/apache/camel-karavan/main/karavan-cloud/openshift/karavan-operator.yaml
    ```
3. Create namespace
    ```
    oc new-project karavan
    ```
4. Edit Karavan Secret manifest according to enviroment and apply
    ```
    oc apply -f openshift/karavan-secret.yaml
    ```
5. Create Karavan Instance and apply
    ```
    oc apply -f openshift/karavan.yaml
    ```