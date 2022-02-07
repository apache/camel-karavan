# Examples

1. Http to Kafka
```
curl -X POST -H "Content-Type: application/json" --data '{"clientId":1,"amount":1000, "description":"some data"}' http://0.0.0.0:8080/demo
```
```
curl -X POST -H "Content-Type: application/json" --data '{"clientId":2,"amount":10000, "description":"some data"}' http://0.0.0.0:8080/demo
```