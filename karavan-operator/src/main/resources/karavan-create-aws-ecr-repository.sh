#!/usr/bin/env bash
echo "Configure aws-cli"
export NAMESPACE=$(cat /var/run/secrets/kubernetes.io/serviceaccount/namespace)
REPO_NAME=${NAMESPACE}/$(inputs.params.project)
aws configure set aws_access_key_id $AWS_ACCESS_KEY_ID 
aws configure set aws_secret_access_key $AWS_SECRET_ACCESS_KEY
aws configure set region $AWS_REGION
aws configure set output $AWS_OUTPUT 
password=$(aws ecr get-login-password --region ${AWS_REGION})
output=$(aws ecr describe-repositories --repository-names ${REPO_NAME} 2>&1)
if [ $? -ne 0 ]; then
    if echo ${output} | grep -q RepositoryNotFoundException; then
         output=$(aws ecr create-repository --repository-name ${NAMESPACE}/$(inputs.params.project) --region $AWS_REGION --tags '[{"Key":'\""$NAMESPACE"\"',"Value":"$(inputs.params.project)"}]')
         if [ $? -ne 0 ]; then
             >&2 echo ${output}
             echo "Failed to create repository $REPO_NAME"
             exit 1
         else
             echo "Successfully created repository $REPO_NAME"
         fi
    fi
else
    >&2 echo "Repository $REPO_NAME already exist. ${output}"
fi
echo $password > /workspace/ecr_password.txt
    