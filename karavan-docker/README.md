### Build docker image
```
docker build -t apache/camel-jbang .
```

### Export postman
```
docker run -v `pwd`/postman:/ws apache/camel-jbang --verbose -Dcamel.jbang.version=3.18.0-SNAPSHOT camel@apache/camel export quarkus --gav=com.foo:acme:1.0 --fresh
```
