![Build](https://img.shields.io/badge/Build_with-Fun-orange.svg?style=for-the-badge)
![Camel](https://img.shields.io/badge/-Camel-orange.svg?style=for-the-badge&)
![Java](https://img.shields.io/badge/-Java-orange.svg?style=for-the-badge&logo=java)
![Quarkus](https://img.shields.io/badge/-Quarkus-orange.svg?style=for-the-badge&logo=quarkus)
![React](https://img.shields.io/badge/-React-orange.svg?style=for-the-badge&logo=react)
![Typescript](https://img.shields.io/badge/-Typescript-orange.svg?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-Apache-orange.svg?style=for-the-badge&logo=apache)

<h1 align="center" style="border-bottom: none">
    Apache Camel Karavan
</h1>

**Apache Camel Karavan** is a **Low-Code Data Integration Platform** 
It simplifies the Apache Camel experience and accelerates developer performance by visually designing and rapidly deploying integration microservices.

* Full power of Apache Camel through Visual Tool
* From Low-code use-cases to Pro-code projects
* Powered by 10+ years of Community Intelligence

<p align="center">
  <img src="images/karavan-clouds.png"  alt="Apache Camel Karavan" />
</p>

## Features

### Designer

* Enterprise Integration Patterns
* 300+ Integration Components 
* REST API designer with OpenAPI to REST DSL generator
* YAML for Integration and Java custom code

#### Topology view
<p align="center">
  <img src="images/topology.png"  alt="Topology" />
</p>

#### Route designer
<p align="center">
  <img src="images/designer-routes.png"  alt="Routes" />
</p>

#### REST API designer
<p align="center">
  <img src="images/designer-rest.png"  alt="REST" />
</p>

### Deployer
* Simple shell scripts for build and deploy
* Configuration 
* Predefined customizable scripts for different platforms

### Developer Dashboard
* Hot Reload
* View live logs during development
* Tracing Exchange Data 

<p align="center">
  <img src="images/karavan-dashboard.png"  alt="karavan-dashboard" />
</p>

## Architecture

Apache Camel Karavan components:

1. **Karavan app** acts as the central interface for the platform, allowing users to manage and orchestrate their integration projects.
2. **Build Container** started by the Karavan app to run integrations in developer mode (dev-mode), package and deploy integrations.
3. **Integration microservices** delivered by the platform.
4. **Git repository** stores all essential project files, including integration YAML configurations, application.properties, container configurations, deployment resources, and templates. It is considered the source of truth for the applications.
5. An **Image Registry** is used by the Apache Camel Karavan to store container images that are generated during the build process.

<p align="center">
  <img src="images/architecture.png"  alt="architecture" />
</p>


## Local
Karavan provides VS Code extension for local developer experience
* Design, code and run integrations on your laptop or PC 
* Deploy to Kubernetes or Openshift
* Download from [Marketplace](https://marketplace.visualstudio.com/items?itemName=camel-karavan.karavan) or [Open VSX Registry](https://open-vsx.org/extension/camel-karavan/karavan)

## Documentation

### How to install on
* [Docker](docs/WEB_DOCKER.md)
* [Kubernetes](docs/WEB_KUBERNETES.md)
* [Openshift](docs/WEB_OPENSHIFT.md)

### Developer guide
* [How to build](docs/DEV.md)


### Feedback
If you haven't done so yet, please be sure to download Karavan and give it a try. We're excited to receive your feedback and learn about your experiences!

* [Ask questions](https://github.com/apache/camel-karavan/discussions)
* [Open Issues](https://github.com/apache/camel-karavan/issues)

