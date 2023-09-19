![Build](https://img.shields.io/badge/Build_with-Fun-blue.svg?style=for-the-badge)
![Camel](https://img.shields.io/badge/-Camel-blue.svg?style=for-the-badge&)
![Java](https://img.shields.io/badge/-Java-blue.svg?style=for-the-badge&logo=java)
![Quarkus](https://img.shields.io/badge/-Quarkus-blue.svg?style=for-the-badge&logo=quarkus)
![React](https://img.shields.io/badge/-React-blue.svg?style=for-the-badge&logo=react)
![Typescript](https://img.shields.io/badge/-Typescript-blue.svg?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-Apache-blue.svg?style=for-the-badge&logo=apache)

![karavan-logo](images/karavan-logo-dark.png#gh-dark-mode-only)
![karavan-logo](images/karavan-logo-light.png#gh-light-mode-only)

Karavan is an Integration Toolkit for Apache Camel, which makes integration easy and fun through the visualization of pipelines, integration with runtimes and package, image build and deploy to Docker or Kubernetes out-of-the-box.

[![Introduction](images/introduction.png)](https://www.youtube.com/watch?v=RA8sH3AH8Gg)

Integrations could be created using visual designer that includes Enterprise Integration Patterns DSL, REST API and Beans builder, all Camel Kamelets and Components. Karavan uses YAML to read/write integrations. Integrations could be run directly from Karavan or they could be exported in the Maven project with preconfigured Camel Quarkus, Camel Spring-Boot or Camel Main runtime. Integration project output is a runnable uber-jar or an OCI image for local environment or a deployed application to a Docker, Kubernetes or OpenShift in any cloud provider.

## Features
### Visual Designer
* Enterprise Integration Patterns
* REST API designer with OpenAPI to REST DSL generator
* 300+ Components 
* Custom Java code snippets

### All in Git
* Integration routes (YAML, Java)
* Configuration (application.properties, docker-compose.yaml, deployment.yaml, etc)
* Customizable build scripts 

### Target deployment
* [Docker](docs/WEB_DOCKER.md)
* [Kubernetes](docs/WEB_KUBERNETES.md)
* [Openshift](docs/WEB_OPENSHIFT.md)

## Documentation
[Karavan documentation](docs/README.md)
