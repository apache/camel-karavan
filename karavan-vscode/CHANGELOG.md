# Changelog

## 0.0.9
1. Support Marshal and Unmarshal elements with configurable DataFormats (`any23`, `asn1`, `avro`, `barcode`, `base64`, `beanio`, `bindy`, `cbor`, `crypto`, `csv`, `custom`, `fhirJson`, `fhirXml`, `flatpack`, `grok`, `gzip`, `hl7`, `ical`, `jacksonxml`, `jaxb`, `json`, `jsonApi`, `lzf`, `mimeMultipart`, `pgp`, `protobuf`, `rss`, `secureXML`, `soapjaxb`, `syslog`, `tarfile`, `thrift`, `tidyMarkup`, `univocity-csv`, `univocity-fixed`, `univocity-tsv`, `xmlrpc`, `xstream`, `yaml`, `zip`, `zipfile`).
2. Support of implicit dsl parameters configured as String, ex. `log: '${body}'` [#141](https://github.com/apache/camel-karavan/issues/141)
3. Configurable JBang parameters: `Dcamel.jbang.version`, `max-messages`, `reload`, `logging-level`

## 0.0.8
1. Custom Kamelets to use in Karavan [#114](https://github.com/apache/camel-karavan/issues/114)
2. GitOps Mode https://github.com/apache/camel-karavan/blob/main/karavan-demo/openshift/README.md
3. Serverless Mode https://github.com/apache/camel-karavan/blob/main/karavan-demo/serverless/README.md
4. Download integration yaml file in GitOps and Serverless mode
5. Add keyword for better discoverability of this extension from VS Code Kubernetes extension

## 0.0.7
1. Hot-fix for `Dragged element disappears when dropped into its child` [#94](https://github.com/apache/camel-karavan/issues/94)

## 0.0.6
1. Extension configuration for `Run locally with CamelJBang` [#70](https://github.com/apache/camel-karavan/issues/70)
2. Reorder steps with drag-and-drop [#39](https://github.com/apache/camel-karavan/issues/39)
3. Kamelets 0.5.0 [#84](https://github.com/apache/camel-karavan/issues/84)
4. Components Catalogue 3.12.0
5. Support read YAML with Implicit Expression field
6. Support read YAML with Implicit `to`

## 0.0.5
1. Support plain YAML routes file 
1. Kamelet YAML DSL for sink and action
1. Run locally with CamelJBang (experimental)
1. Light theme improvements
1. UI improvements: filename in title, default parameter value in Field tooltip
