# Parcels Delivery Service on localhost

## Prerequisites

1. [VSCode](https://code.visualstudio.com/download)  installed
2. Apache Camel [Karavan](https://marketplace.visualstudio.com/items?itemName=camel-karavan.karavan) extension installed
3. [Jbang](https://www.jbang.dev/download/) installed
4. Docker and Docker compose installed
5. Build Apache Artemis Docker Image
```
cd artemis
./prepare-docker.sh --from-release --artemis-version 2.20.0
cd _TMP_/artemis/2.20.0
docker build -f ./docker/Dockerfile-adoptopenjdk-11 -t artemis-adoptopenjdk-11 .
cd ../../../../
```
For MacOS users, in case of `tree command not found` error, install tree `brew install tree`

## How-to
### Start environment
```
docker-compose up
```
### Start integration 
```
jbang -Dcamel.jbang.version=3.16.0-SNAPSHOT camel@apache/camel run postman.yaml
```
### Publish parcel
```
curl -X POST -H "Content-Type: application/json" --data '{"id":"1","address":"666 Sin Street, Holy City"}' http://0.0.0.0:8080/parcels
```
### Publish payment
Open AMQ7 Broker Management [Console](http://localhost:8161)

Send message to `payments` queue
```
<?xml version="1.0" encoding="UTF-8" ?>
<root>
  <id>1</id>
  <amount>777</amount>
  <status>confirmed</status>  
</root>
```
