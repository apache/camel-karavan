## Karavan in Docker

### Requirements
1. Linux or MacOS
2. Docker Engine 24+

### How to run Karavan on Docker
1. Download [docker-compose.yaml](install/karavan-docker/docker-compose.yaml)
2. Set Environment Variables for Git Repository and Container Image Registry connections in docker-compose.yaml
2. Create network
    ```
    docker network create karavan
    ```
3. Start Karavan
    ```
    docker compose up
    ```
3. Open http://localhost:8080

### How to run Demo Karavan on Docker with Gitea

1. Download [karavan-docker](install/karavan-docker) folder
2. Unzip data.zip with Gitea database in karavan-docker folder
    ```
    unzip data.zip
    ```
2. Create network
    ```
    docker network create karavan
    ```
3. Start Karavan
    ```
    docker compose -f docker-compose-gitea.yaml up
    ```
3. Open http://localhost:8080
