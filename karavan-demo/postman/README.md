
```
curl -X POST -H "Content-Type: application/json" --data '{"id":1,"address":"666 Sin Street, Holy City"}' http://0.0.0.0:8080/parcels
```

```
<?xml version="1.0" encoding="UTF-8" ?>
<root>
  <id>1</id>
  <amount>777</amount>
  <confirmed>true</confirmed>  
</root>
```