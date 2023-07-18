## Karavan on AWS Kubernetes cluster

# Requirements
 ### Setup Kubernetes on AWS
 1. Create a new [VPC](https://docs.aws.amazon.com/directoryservice/latest/admin-guide/gsg_create_vpc.html#create_vpc)
Create public subnet.
2. install [eksctl and kubectl](https://docs.aws.amazon.com/eks/latest/userguide/install-kubectl.html). Install [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html) and configure it with your credentials.
3. [Create a Cluster](https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html)
    ```
    eksctl create cluster --name karavan-kubernetes-cluster --region your-region-code --version 1.23 --vpc-public-subnets your-first--vpc-subnet, your-second--vpc-subnet --without-nodegroup
    ```

4. [Create a NodeGroup](https://docs.aws.amazon.com/eks/latest/userguide/create-managed-node-group.html)
	```
	eksctl create nodegroup --cluster karavan-kubernetes-cluster --region region-code --name karavan-kubernetes-nodegroup --node-type m5.large --nodes 1 --nodes-min 1 --nodes-max 1 --ssh-public-key your-sshkey
	```
 5. Configure kubectl so that you can connect to an Amazon EKS cluster.
    ```
    aws eks update-kubeconfig --name karavan-kubernetes-cluster
    ```
6. Create a Karavan Namespace 
    ```
    kubectl create namespace karavan
    ```
7. Set the current Namespace to Karavan
    ```
    kubectl config set-context --current --namespace=karavan
    ```
8. Create a [Storage Class](https://docs.aws.amazon.com/eks/latest/userguide/efs-csi.html#efs-install-driver ). To learn more about storage class in AWS you can [read](https://aws.amazon.com/blogs/storage/persistent-storage-for-kubernetes)

 9. Modify AWS/karavan-sc.yaml. Update fileSystemId with the fileSystemId created in above step.
    ```
	kubectl apply -f AWS/karavan-sc.yaml
	```

10. Install Tekton
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

11. Modify the karavan-secret.yaml file and apply Karavan Secret.
    ```
     kubectl apply -f AWS/karavan-secret.yaml
    ```	 
12. If you like to use managed infispan service, update `karavan-app-deployment-public.yaml` with below details.    Username / password for the infispan service should be admin/password
    ```
            - env:
            - name: KUBERNETES_NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: quarkus.infinispan-client.server-list
              value: InfispanIp:11222
            - name: quarkus.infinispan-client.devservices.enabled
              value: No
    ```
13. Create Karavan Instance and apply
    ```
    kubectl apply -k AWS --namespace karavan
    ```
14. Open Karavan Page in browser. Karavan expose the NodePort service on node port 30365. Find out the ip addres of the cluster node and open the url
    ```
	http://NodeIP:30365
	```

15. If you want to delete the deployment
    ```
    kubectl delete -k AWS --namespace karavan
    ```


### Optional
1.  Access Tekton Dashboard 
    ```
    kubectl port-forward -n tekton-pipelines service/tekton-dashboard 9097:9097

