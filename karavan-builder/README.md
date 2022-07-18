### Build docker image
```
docker build -t apache/camel-karavan-builder .
```

### To deploy to test and prod from karavan namespace
```
oc policy add-role-to-user system:image-puller system:serviceaccount:test:default --namespace=karavan
oc policy add-role-to-user system:image-puller system:serviceaccount:prod:default --namespace=karavan
```
