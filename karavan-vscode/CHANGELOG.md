# Changelog

## 3.18.0
1. Camel 3.18.0+ DSL
2. Export to Camel-Qurkus, Spring-Boot and Camel-Main
3. Default application.properties

## 0.0.15
1. Camel 3.17.0+ DSL
2. Generate REST DSL and Routes stubs from Open API
3. Build Runner to Run, Package Uber-Jar, Build Image, Deploy to minikube and OpenShift
4. Profiles for Run, Package, Build and Deploy
5. Catalogue of EIP
6. Catalogue of Kamelets
7. Catalogue of Components
8. Multiple UI improvements
9. Kamelets 0.8.1

## 0.0.14
Usability improvements
1. Insert new step between existing steps
2. Clone REST and REST Method
3. Clone Bean
4. Clone Dependency
5. Copy/paste EIP DSL element 
6. Security and Scheduler parameters are hidden by default for Components (Expandable Section)
7. Advanced parameters are hidden by default for EIP (Expandable Section)
8. Open Integration, open yaml, run with Jbang context menu in Karavan view in VS Code
9. Build-in route creation Tour

## 0.0.13
Requires Camel 3.16.0 and later
1. REST DSL
2. Support Camel 3.16.0 DSL
3. New theme
4. Resizable properties panel
5. New Karavan views in VS Code

## 0.0.12
Requires Camel 3.16.0 and later
1. Beans
3. Dependencies
4. Support Camel 3.16.0 DSL
5. New theme
6. Resizable properties panel
7. New Karavan views in VS Code

## 0.0.11
1. Hot fix: Set Camel Jbang alias as `camel@apache/camel`
2. Hot fix: Read Implicit Expressions from YAML

## 0.0.10
1. New look and Feel
2. Expression languages
3. DSL implementation for Try, Catch, Finally, CircuitBreaker, etc


## 0.0.9
1. Support Marshal and Unmarshal elements with configurable DataFormats (`any23`, `asn1`, `avro`, `barcode`, `base64`, `beanio`, `bindy`, `cbor`, `crypto`, `csv`, `custom`, `fhirJson`, `fhirXml`, `flatpack`, `grok`, `gzip`, `hl7`, `ical`, `jacksonxml`, `jaxb`, `json`, `jsonApi`, `lzf`, `mimeMultipart`, `pgp`, `protobuf`, `rss`, `secureXML`, `soapjaxb`, `syslog`, `tarfile`, `thrift`, `tidyMarkup`, `univocity-csv`, `univocity-fixed`, `univocity-tsv`, `xmlrpc`, `xstream`, `yaml`, `zip`, `zipfile`).
2. Support of implicit dsl parameters configured as String, ex. `log: '${body}'` [#141](https://github.com/apache/camel-karavan/issues/141)
3. Configurable JBang parameters: `Dcamel.jbang.version`, `max-messages`, `reload`, `logging-level`
4. Fixed `Jbang Run` broken after upgrade VSCode to 1.63 [#148](https://github.com/apache/camel-karavan/issues/148)

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
