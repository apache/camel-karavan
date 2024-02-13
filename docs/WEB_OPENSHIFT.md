## Karavan in Openshift

### Requirements
1. Openshift v4.13+ and openshift-cli installed

### Install on OpenShift Local
1. Start OpenShift Local
    ```
    crc start
    ```
2. Get credentials
    ```
    crc console --credentials
    ```
3. Login as an admin
    ```
    oc login -u kubeadmin -p password https://YOUR_OPENSHIFT_HOST:PORT
    ```
4. Install Karavan using Maven

    Download installer from Maven Central: https://repo1.maven.org/maven2/org/apache/camel/karavan/karavan-installer/4.3.0/karavan-installer-4.3.0.jar 
    
    ex. with following command:
    ```
    mvn org.apache.maven.plugins:maven-dependency-plugin:3.0.2:copy -Dartifact=org.apache.camel.karavan:karavan-installer:4.3.0:jar -DoutputDirectory=.
    ```

    Install Karavan with Gitea (for demo purpose)
    ```
    java -jar karavan-installer-4.3.0.jar --install-gitea
    
    ```

5. Install Karavan using Jbang

    Install Karavan with Gitea (for demo purpose)
    ```
    jbang org.apache.camel.karavan:karavan-installer:4.3.0 --install-gitea
    ```

6. Get karavan route host
    ```
    oc get route karavan -n karavan -o jsonpath='{.spec.host}'
    ```
   Use karavan host to connect to the application


### Install parameters

    `--namespace` - Namespace
    `--node-port` - Node port
    `--yaml` - Create YAML file. Do not apply
    `--file` - YAML file name, defaultValue = `karavan.yaml`
    `--openshift` - Create files for OpenShift

    `--git-repository` - Git repository
    `--git-username` - Git username
    `--git-password` - Git password
    `--git-branch` - Git branch
    `--install-gitea` - Install Gitea (for demo purposes), defaultValue = `false`
            
    `--image-registry` - Image registry
    `--image-group` - Image group, defaultValue = `karavan`
    `--image-registry-username` - Image registry username
    `--image-registry-password` - Image registry password