![License](https://img.shields.io/badge/License-Apache-blue.svg?style=for-the-badge&logo=apache)

## Apache Camel Karavan
**Mastering Tool for Apache Camel** makes integration easy and fun through the visualization of pipelines and integration with runtimes.

![karavan-vscode](images/karavan-vscode.png)

# Features

* Enterprise Integration Patterns DSL
* REST DSL
* Beans and dependencies
* 100+ Kamelets source/sink/action
* 300+ Components consumer/producer
* Read/Write Integration CRD (*.yaml with kind:Integration) and plain yaml routes
* Integration with [Camel-K](https://camel.apache.org/camel-k/next/index.html) and [JBang](https://www.jbang.dev)


# Installation

## Prerequisites
* Microsoft VS Code installed. You can get the most recent version from (https://code.visualstudio.com/) for your chosen operating system.

## How to install
1. Open your VS Code Integrated Development Environment (IDE).
2. In the VS Code Activity Bar, select Extensions. (Alternatively, press Ctrl+Shift+X).
3. In the search bar, type **Karavan**
4. In the **Apache Camel Karavan** box, click **Install**.

![install](images/install.png)

# Create and edit integration 

## Create new Integration

![create](images/create.png)

## Edit an existing Integration

![open](images/open.png)


# Run integration

## Run integration locally
* [JBang](https://www.jbang.dev) installed
* Click ![run](images/run.png) button in VS Code or
```shell
jbang -Dcamel.jbang.version=3.16.0 camel@apache/camel run $INTEGRATION.yaml --max-messages=10 --logging-level=info
```

## Run integration in Kubernetes or OpenShift

## Prerequisites 

* Apache Camel K installed. See the Apache Camel K installation page for details: (https://camel.apache.org/camel-k/next/installation/installation.html).
* OpenShift or Kubernetes CLI

## Deploy with Camel K on Kubernetes

```shell
kubectl apply -f integration.yaml
```

## Deploy with Camel K on OpenShift

```shell
oc apply -f integration.yaml
```

# Issues

If you find a new issue, please [create a new issue report in GitHub](https://github.com/apache/camel-karavan/issues)!
