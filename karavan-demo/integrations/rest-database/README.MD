## REST service to store/retrieve data to/from database (Postgres)
Localhost Integration prototype with Camel & Jbang

## Prerequisites
Docker, docker-compose, jbang, VSCode with Camel Karavan extension installed

## How to

1. Start Docker compose (Postgres and PgAdmin)
```
docker-compose up
```

2. Start Camel integration
```
jbang camel@apache/camel run rest-database.yaml --logging-level=info
```

3. Store data to database
```
curl -X POST -H "Content-Type: application/json" --data '{"id":1,"name":"John Doe"}' http://0.0.0.0:8080/client
curl -X POST -H "Content-Type: application/json" --data '{"id":2,"name":"Jane Doe"}' http://0.0.0.0:8080/client
```

4. Retrieve data from database
```
curl -X GET -H "Content-Type: application/json" http://0.0.0.0:8080/client
```