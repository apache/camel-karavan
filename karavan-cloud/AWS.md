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
8. Create a Volume in the same region as your node. Make sure volume is in same availability-zone as your Node's EC2 instance.
    ```
    aws ec2 create-volume --availability-zone your-availability-zone --volume-type gp2 --size 50 --tag-specifications 'ResourceType=volume,Tags=[{Key=karavan-kubernetes,Value=karavan-kubernetes}]'
    ```
    copy the VolumeId, it will be used later.
9. The Amazon EBS CSI driver isn't installed when you first create a cluster. To use the driver, you must add it as an Amazon EKS add-on or as a self-managed add-on.
    For instructions on how to add it as an Amazon EKS add-on, see [Managing the Amazon EBS CSI driver as an Amazon EKS add-on](https://docs.aws.amazon.com/eks/latest/userguide/managing-ebs-csi.html). Before moving to the next step, wait until driver status is Active.
10. Create your Amazon EBS CSI plugin IAM role with the AWS CLI. for more details reffer [csi-iam-role](https://docs.aws.amazon.com/eks/latest/userguide/csi-iam-role.html)
    ``` 
    aws eks describe-cluster --name karavan-kubernetes-cluster  --query "cluster.identity.oidc.issuer" --output text
    ```
    1. Create the IAM role.Copy the following contents to a file that's named aws-ebs-csi-driver-trust-policy.json. Replace 111122223333 with your account ID, region-code with your AWS Region, and EXAMPLED539D4633E53DE1B71EXAMPLE with the value that was returned in the previous step.
       ```
		{
		"Version": "2012-10-17",
		"Statement": [
			{
			"Effect": "Allow",
			"Principal": {
				"Federated": "arn:aws:iam::111122223333:oidc-provider/oidc.eks.region-code.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE"
			},
			"Action": "sts:AssumeRoleWithWebIdentity",
			"Condition": {
				"StringEquals": {
				"oidc.eks.region-code.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:aud": "sts.amazonaws.com",
				"oidc.eks.region-code.amazonaws.com/id/EXAMPLED539D4633E53DE1B71EXAMPLE:sub": "system:serviceaccount:kube-system:ebs-csi-controller-sa"
				}
			}
			}
			]
		}
       ```
    2. Create the role. 
       ```
       aws iam create-role --role-name AmazonEKS_EBS_CSI_DriverRole_karavan --assume-role-policy-document file://"aws-ebs-csi-driver-trust-policy.json"
       ```
    3. Attach the required AWS managed policy to the role with the following command.
       ```
       aws iam attach-role-policy --policy-arn arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy --role-name AmazonEKS_EBS_CSI_DriverRole_karavan
       ```
    4. Annotate the ebs-csi-controller-sa Kubernetes service account with the ARN of the IAM role. Replace 111122223333 with your account ID
       ```
       kubectl annotate serviceaccount ebs-csi-controller-sa \
       -n kube-system \
       eks.amazonaws.com/role-arn=arn:aws:iam::111122223333:role/AmazonEKS_EBS_CSI_DriverRole_karavan --overwrite
       ```
    5. `kubectl rollout restart deployment ebs-csi-controller -n kube-system`
    6. `eksctl utils associate-iam-oidc-provider --cluster karavan-kubernetes-cluster --approve`


11. Install Tekton
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

12. Modify the karavan-secret.yaml file and apply Karavan Secret.
    ```
     kubectl apply -f AWS/karavan-secret.yaml
    ```	 
13. Update karavan-pv.yaml with the AWS volumeId created above. If you like to use managed infispan service, update `karavan-app-deployment-public.yaml` with below details. Username / password for the infispan service should be admin/password
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
14. Create Karavan Instance and apply
    ```
    kubectl apply -k AWS --namespace karavan
    ```
15. Install the NGINX ingress controller
    ```
	kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.5.1/deploy/static/provider/cloud/deploy.yaml
	kubectl port-forward --namespace=ingress-nginx service/karavan 8080:80
	```

15. If you want to delete the deployment
    ```
    kubectl delete -k AWS --namespace karavan
    ```

