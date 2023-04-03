/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.operator.spec;

        import io.quarkiverse.operatorsdk.bundle.runtime.CSVMetadata;
        import io.quarkiverse.operatorsdk.bundle.runtime.SharedCSVMetadata;


@CSVMetadata(
        name = "camel-karavan-operator.v3.20.2-SNAPSHOT",
        annotations = @CSVMetadata.Annotations(
                containerImage = "ghcr.io/apache/camel-karavan-operator:3.20.2-SNAPSHOT",
                repository = "https://github.com/apache/camel-karavan",
                capabilities = "Basic Install",
                categories = "Developer Tools, Integration & Delivery",
                certified = false,
                almExamples = "[\n" +
                        "  {\n" +
                        "    \"apiVersion\": \"camel.apache.org/v1\",\n" +
                        "    \"kind\": \"Karavan\",\n" +
                        "    \"metadata\": {\n" +
                        "      \"labels\": {\n" +
                        "        \"app\": \"karavan\"\n" +
                        "      },\n" +
                        "      \"name\": \"karavan\"\n" +
                        "    },\n" +
                        "    \"spec\": {\n" +
                        "      \"instances\": 1,\n" +
                        "      \"auth\": \"public\",\n" +
                        "      \"environment\": \"dev\"\n" +
                        "      \"runtimes\": \"quarkus,spring-boot\"\n" +
                        "      \"gitPullInterval\": \"30s\"\n" +
                        "    }\n" +
                        "  }\n" +
                        "]"
        ),
        displayName = "Camel Karavan Operator",
        description = "Apache Camel Karavan\n" +
                "====================\n" +
                "Karavan is an Integration Toolkit for Apache Camel, which makes integration easy and fun through the visualization of pipelines,\n" +
                "integration with runtimes and package, image build and deploy to kubernetes out-of-the-box.\n" +
                "\n" +
                "## Installation\n" +
                "\n" +
                "1. Install Apache Camel Karavan Operator\n" +
                "2. Install Tekton operator\n" +
                "3. Create namespace, ex: `karavan`\n" +
                "4. Create `Secret` in the namespace, ex:\n" +
                "```\n" +
                "kind: Secret\n" +
                "apiVersion: v1\n" +
                "metadata:\n" +
                "  name: karavan\n" +
                "  namespace: karavan\n" +
                "type: Opaque\n" +
                "stringData:\n" +
                "  master-password: karavan\n" +
                "  oidc-secret: secret\n" +
                "  oidc-server-url: https://hostname/auth/realms/karavan\n" +
                "  oidc-frontend-url: https://hostname/auth\n" +
                "  git-repository: https://github.com/repository/projects.git\n" +
                "  git-password: password\n" +
                "  git-username: username\n" +
                "  git-branch: main\n" +
                "  image-registry: image-registry.openshift-image-registry.svc:5000\n" +
                "```\n" +
                "5. Create `Karavan` instance in the namespace, ex:\n" +
                "```\n" +
                "apiVersion: camel.apache.org/v1\n" +
                "kind: Karavan\n" +
                "metadata:\n" +
                "  name: karavan\n" +
                "  namespace: karavan\n" +
                "spec:\n" +
                "  instances: 1\n" +
                "  auth: public\n" +
                "  environment: demo\n" +
                "  runtimes: quarkus,spring-boot\n" +
                "  gitPullInterval: 30s\n" +
                "```\n",
        permissionRules = {
                @CSVMetadata.PermissionRule(apiGroups = "camel.apache.org", resources = {"karavans", "karavans/status", "karavans/finalizers"}),
                @CSVMetadata.PermissionRule(apiGroups = "rbac.authorization.k8s.io", resources = {"roles", "rolebindings", "clusterroles", "clusterrolebindings"}),
                @CSVMetadata.PermissionRule(apiGroups = {"image.openshift.io"}, resources = {"imagestreams", "imagestreams/layers"}),
                @CSVMetadata.PermissionRule(apiGroups = {"route.openshift.io"}, resources = {"routes"}),
                @CSVMetadata.PermissionRule(apiGroups = {"networking.k8s.io"}, resources = {"ingresses"}),
                @CSVMetadata.PermissionRule(apiGroups = {"apps"}, resources = {"deployments"}),
                @CSVMetadata.PermissionRule(apiGroups = {""}, resources = {"serviceaccounts", "secrets", "configmaps", "services", "persistentvolumes", "persistentvolumeclaims"}),
                @CSVMetadata.PermissionRule(apiGroups = {"operators.coreos.com"}, resources = {"subscriptions"}, verbs = {"get", "list", "watch"}),
                @CSVMetadata.PermissionRule(apiGroups = {"tekton.dev"}, resources = {"tasks", "pipelines"}),
                @CSVMetadata.PermissionRule(apiGroups = {"apiextensions.k8s.io"}, resources = {"customresourcedefinitions"}, verbs = {"get", "list", "watch"}),
        },
        keywords = {"apache", "camel", "karavan", "integration", "microservices", "low-code"},
        version = "3.20.1-SNAPSHOT",
        maintainers = @CSVMetadata.Maintainer(name = "The Apache Software Foundation", email = "users@camel.apache.org"),
        provider = @CSVMetadata.Provider(name = "The Apache Software Foundation"),
        maturity = "alpha",
        minKubeVersion = "1.11.0",
        icon = @CSVMetadata.Icon(
                fileName = "karavan.svg"
        ),
        installModes = {
                @CSVMetadata.InstallMode(type = "AllNamespaces")
        },
        links =  {
                @CSVMetadata.Link(name = "Apache Camel Karavan source code repository", url = "https://github.com/apache/camel-karavan")
        }
)
public class KaravanOperatorCSVMetadata implements SharedCSVMetadata {
}
