```
gpg --print-md SHA512 camel-karavan-${VERSION}.zip > camel-karavan-${VERSION}.zip.sha512                                       
gpg --armor --output camel-karavan-${VERSION}.zip.asc --detach-sig camel-karavan-${VERSION}.zip
```