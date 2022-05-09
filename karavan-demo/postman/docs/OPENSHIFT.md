# Parcels Delivery Service on OpenShfit

## Prerequisites

1. [VSCode](https://code.visualstudio.com/download)  installed
2. Apache Camel [Karavan](https://marketplace.visualstudio.com/items?itemName=camel-karavan.karavan) extension installed
3. [Jbang](https://www.jbang.dev/download/) installed
4. OpenShift 4.9+ cluster up and running
4. OpenShift 4.9+ CLI installed

## How-to
### Install AMQ and AMQ Streams Operators
Also creates `postman` namespace required for the demo
```
oc apply -k manifests/operators
```
Check that operators are succesfully installed
![operators](operators.png)

### Create AMQ, Kafka and Postgres demo instances 
```
oc apply -k manifests/instances
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
