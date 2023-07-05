## Install Infinispan

More info: https://infinispan.org/docs/helm-chart/main/helm-chart.html

### Requirements
1. minikube v1.30+ installed with `--driver=hyperkit`
2. `helm` client

### Installation
1. Add the OpenShift Helm Charts repository
    ```
    $ helm repo add openshift-helm-charts https://charts.openshift.io/
    ```
2. Create a secrets, ex `infinispan-secrets.yaml`:
```
apiVersion: v1
kind: Secret
metadata:
  name: karavan-infinispan
type: Opaque
stringData:
  username: monitor
  password: password
  identities-batch: |-
    user create admin -p karavan -g admin
    user create monitor -p password --users-file metrics-users.properties --groups-file metrics-groups.properties
```
4. Apply secret
    ```
    kubectl apply -f infinispan-secrets.yaml
    ```
5. Create a values file that configures your Infinispan cluster, ex `infinispan-values.yaml`:
   ```
   images:
     server: quay.io/infinispan/server:latest
     initContainer: registry.access.redhat.com/ubi8-micro
   deploy:
     security:
       authentication: true
       secretName: karavan-infinispan
     replicas: 1
     container:
       storage:
         ephemeral: true
     expose:
       type: NodePort
       nodePort: 32666
   ```
5. Install the Infinispan chart and specify your values file
    ```
    kubectl config set-context --current --namespace=karavan
    helm install infinispan openshift-helm-charts/infinispan-infinispan --values infinispan-values.yaml
    ```
6. Configure hosts for `karavan-app` in `application.properties`:
   ```
   quarkus.infinispan-client.hosts=infinispan.karavan:11222
   ```
