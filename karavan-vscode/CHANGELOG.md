# Changelog

## 4.4.0
0. Camel 4.4.0
1. Camel-main Runtime
2. Kamelets 4.4.0
3. Jkube 1.16.0
4. JBang v0.114.0

## 4.3.0
0. Camel 4.3.0
1. Camel-main Runtime
2. Kamelets 4.3.0
3. Jkube 1.15.0
4. JBang v0.114.0

## 4.1.0
0. Camel 4.1.0
1. Camel-main Runtime
2. Kamelets 4.1.0
3. Jkube 1.14.0

## 4.0.0
0. Camel 4.0.0
1. Camel-main Runtime
2. Kamelets 4.0.0
3. Jkube 1.14.0


## 3.21.0
0. Camel 3.21.0
1. Kamelets 3.21.0
2. Spring Boot 2.7.13
3. jkube 1.13.1 d
4. Quarkus 2.16.7.Final

## 3.20.1
0. Camel 3.20.3
1. Karavan pulls changes made outside of karavan application
2. Karavan runs pipelines for commits outside of karavan application
3. User cand add custom Git message through karavan application UI
4. Karavan VS Code extension could be configured to use a subset of components
5. User can stop running pipleine thought UI
6. UI improvements: Default `when` and `otherwise` steps for `choice`, default log message for `log`

## 3.20.0
0. Camel 3.20.1
1. Export to Quarkus and Spring Boot application in VS Code
2. Deploy to Kubernetes and Openshift from VS Code
3. Quarkus and Spring Boot in cloud-native mode
4. Kamelets 3.20.1.1
5. Route Configuration DSL
6. Quarkus 2.16.0.Final 
7. Spring Boot 2.7.7
8. Code snippets for custom Processor and AggregationStrategy
9. Route and EIP DSL copy/paste (experimental)


## 3.18.5
1. First preview of Karavan Operator 
2. Kamelets 0.9.2
3. Camel 3.18.3
4. Deployment in VS Code
5. First preview of Dashboard
6. Export routes as PNG image

## 3.18.4
1. Support minikube for cloud app
2. OpenAPI YAML import in cloud app
3. Quarkus 2.13.0.Final 
4. Improved performance in web-based IDEs
5. Search Kamelets by description
6. Improved Deployments and Pods monitoring with Watchers
7. Editor window for Expressions
8. Password-editor for Sensitive keys from camel-core

## 3.18.3
1. Camel 3.18.2 DSL
2. Kamelets 0.9.0
3. SSO/Keycloak support for Karavan cloud-native application

## 3.18.2
1. Hot-fix: Incorrect YAML generated for doTry/doFinally

## 3.18.1
1. Upgrade to Camel 3.18.1 and jbang 0.97.0
2. DSL Elements could be moved (drag-and-drop) to Step DSL as steps
3. Fixed issues with Drag-and-Drop
4. Fixed issues with Beans and REST dissapearing
5. Fixed issues with run local with jbang in `--dev` mode

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
8. Open Integration, open yaml, run with JBang context menu in Karavan view in VS Code
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
1. Hot fix: Set Camel JBang alias as `camel@apache/camel`
2. Hot fix: Read Implicit Expressions from YAML

## 0.0.10
1. New look and Feel
2. Expression languages
3. DSL implementation for Try, Catch, Finally, CircuitBreaker, etc


## 0.0.9
1. Support Marshal and Unmarshal elements with configurable DataFormats (`any23`, `asn1`, `avro`, `barcode`, `base64`, `beanio`, `bindy`, `cbor`, `crypto`, `csv`, `custom`, `fhirJson`, `fhirXml`, `flatpack`, `grok`, `gzip`, `hl7`, `ical`, `jacksonxml`, `jaxb`, `json`, `jsonApi`, `lzf`, `mimeMultipart`, `pgp`, `protobuf`, `rss`, `secureXML`, `soapjaxb`, `syslog`, `tarfile`, `thrift`, `tidyMarkup`, `univocity-csv`, `univocity-fixed`, `univocity-tsv`, `xmlrpc`, `xstream`, `yaml`, `zip`, `zipfile`).
2. Support of implicit dsl parameters configured as String, ex. `log: '${body}'` [#141](https://github.com/apache/camel-karavan/issues/141)
3. Configurable JBang parameters: `Dcamel.jbang.version`, `max-messages`, `reload`, `logging-level`
4. Fixed `jbang run` broken after upgrade VSCode to 1.63 [#148](https://github.com/apache/camel-karavan/issues/148)

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
