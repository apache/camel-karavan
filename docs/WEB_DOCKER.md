## Karavan in Docker

### Requirements
1. Linux or MacOS
2. Docker Engine 24+

### How to run Karavan on Docker
1. Download [docker-compose.yaml](/apache/camel-karavan/refs/heads/main/docs/install/karavan-docker/docker-compose.yaml)
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

    Default username: `admin`, password: [**********](https://github.com/apache/camel-karavan/blob/3308dfb1df7a6559c027d236243de15e7481cd88/karavan-app/src/main/resources/application.properties#L109C19-L109C29)

