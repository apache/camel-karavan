## Karavan in Docker

### Requirements
1. Linux or MacOS
2. Docker Engine 24+

### How to run Karavan on Docker
1. Create network
    ```
    docker network create karavan
    ```
2. Start Karavan with demo features
    ```
    docker run -it --rm  --name karavan \
        --network karavan -p 8080:8080 \
        -e KARAVAN_GIT_INSTALL_GITEA=true \
        -e KARAVAN_IMAGE_REGISTRY_INSTALL=true \
        -v /var/run/docker.sock:/var/run/docker.sock \
        ghcr.io/apache/camel-karavan:4.1.0
    ```
3. Open http://localhost:8080

### Configuration variables
1. For demo/evaluation purposes:

    Install Gitea Git repository
    ```
    -e KARAVAN_GIT_INSTALL_GITEA=true
    ```

    Install Image registry
    ```
    -e KARAVAN_IMAGE_REGISTRY_INSTALL=true
    ```

2. Maven cache
    ```
    -e KARAVAN_MAVEN_CACHE=$YOUR_PATH_TO_MAVEN/.m2
    ```

3. Git repository
    ```
    -e KARAVAN_GIT_REPOSITORY=$YOUR_GIT_REPOSITORY \
    -e KARAVAN_GIT_USERNAME=$YOUR_GIT_USERNAME \
    -e KARAVAN_GIT_PASSWORD=$YOUR_GIT_PASSWORD \
    -e KARAVAN_GIT_BRANCH=$YOUR_GIT_DEFAULT_BRANCH \
    ```

4. Image registry
    ```
    -e KARAVAN_IMAGE_REGISTRY=$YOUR_IMAGE_REGISTRY \
    -e KARAVAN_IMAGE_REGISTRY_USERNAME=$YOUR_IMAGE_REGISTRY_USERNAME \
    -e KARAVAN_IMAGE_REGISTRY_PASSWORD=$YOUR_IMAGE_REGISTRY_PASSWORD \
    -e KARAVAN_IMAGE_GROUP=$YOUR_IMAGE_GROUP \
    ```    

