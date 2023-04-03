# Roadmap 2023

## Done:
### Camel Error Handler
ErrorHandler YAML DSL is different from canonical Java/XML DSL.
We need first to synchronize DSLs and then generate visual elements for error handling.

### Web-based IDE 
To support web-based IDEs like Gitpod, DevSpaces, GitHub Codespaces, etc, web-extension specific configuration will be added to Karavan VS Code extension.
Karavan will also be published in the Open VSX marketplace.

### Kubernetes Operator
To simplify Karavan installation in Kubernetes/Openshift we have been working on Karavan Operator.

## TODO:
### Visual debugging and tracing
Karavan users can already  package, build and deploy integrations in one click.
However a real integration development process is iterative and requires debugging.

Visual debugging process will be implemented, so users will be able stopping/stepping running routes and have access to exchange data (body, headers, properties)  

### Monitoring and dashboards
We are planning to create a Dashboard page in the Karavan cloud application.

Dashboard should show all Deployments, Pods, Pipelines and camel-context health-check information associated with Camel projects. Projects should not be limited to Karavan-created projects.

### Propagation between environments
Current version of Karavan deploys integration images (using Tekton pipeline) in the dev environment (same namespace where karavan application deployed).

We are considering implementing integration propagation between dev and test/prod environment as an immutable image that is already in the image repository. Users should be able to select imageId to be propagated. 

### Access Control
The following access control are planning to be implemented:

1. Role-Based Access Control (RBAC)
    * Developer creates project, routes, rest api, build and deploy
    * Viewer has view-only access
    * Administrator could change projects templates and default values
2. Group-Based Access Control
    * Each project has a group in Keycloak (with the same name)
    * Only group member could have access to the project

### Data mapping
The most requested feature for Karavan is Data Mapping.

We are analyzing existing open-source data mapping solutions like AtlasMap that might be embedded into Karavan Designer. 

Another option is to implement dedicated Camel-specific data mapping functionality that take into consideration Camel Exchange structure and can leverage Camel data transformation functionality and built-in Expression languages.    
