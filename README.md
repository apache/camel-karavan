![Build](https://img.shields.io/badge/Build_with-Fun-blue.svg?style=for-the-badge)
![Camel](https://img.shields.io/badge/-Camel-blue.svg?style=for-the-badge&)
![Java](https://img.shields.io/badge/-Java-blue.svg?style=for-the-badge&logo=java)
![Quarkus](https://img.shields.io/badge/-Quarkus-blue.svg?style=for-the-badge&logo=quarkus)
![React](https://img.shields.io/badge/-React-blue.svg?style=for-the-badge&logo=react)
![Typescript](https://img.shields.io/badge/-Typescript-blue.svg?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-Apache-blue.svg?style=for-the-badge&logo=apache)

![karavan-logo](images/karavan-logo-dark.png#gh-dark-mode-only)
![karavan-logo](images/karavan-logo-light.png#gh-light-mode-only)

Karavan is an Integration Toolkit for Apache Camel, which makes integration easy and fun through the visualization of pipelines, integration with runtimes and package, image build and deploy to kubernetes out-of-the-box.

![karavan-clouds](images/karavan-clouds.png)

Integrations could be created using visual designer that includes Enterprise Integration Patterns DSL, REST API and Beans builder, all Camel Kamelets and Components. Karavan uses YAML to read/write integrations. Integrations could be run directly from Karavan UI using Camel JBang. Also they could exported in Maven project with preconfigured Camel Quarkus, Camel Spring-Boot or Camel Main runtime. Integration project output is a runnable uber-jar or an OCI image for local environment or a deployed application to a Kubernetes/OpenShift in any cloud provider.

## Introduction

https://user-images.githubusercontent.com/1379213/211049026-4496d054-d529-4917-837f-a59b6f2f84b1.mp4

## Features
### Mode
* Web application
* VS Code extension
### Visual Designer for Integrations
* Enterprise Integration Patterns DSL
* REST DSL designer
* OpenAPI to REST DSL generator
* Beans and dependencies
* 100+ Kamelets source/sink/action
* 300+ Components consumer/producer
* Read/Write yaml routes
### Runtimes
* [Camel JBang](https://camel.apache.org/manual/camel-jbang.html)
* [Camel Quarkus](https://camel.apache.org/camel-quarkus)
* [Camel Spring-Boot](https://camel.apache.org/camel-spring-boot)
### Build and Deploy
* Maven for local development
* Tekton Pipelines for Kubernetes/OpenShift
### Knowledgebase
Build-in catalogues:
* Enterprise Integration Patterns
* Kamelets
* Components

## Documentation
[Karavan documentation](docs/INDEX.md)
