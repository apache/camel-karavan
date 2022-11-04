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
        name = "camel-karavan-operator",
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
                "  projects-git-repository: https://github.com/repository/projects.git\n" +
                "  projects-git-password: password\n" +
                "  projects-git-username: username\n" +
                "  projects-git-branch: main\n" +
                "  kamelets-git-repository: https://github.com/repository/kamelets.git\n" +
                "  kamelets-git-password: password\n" +
                "  kamelets-git-username: username\n" +
                "  kamelets-git-branch: main\n" +
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
        version = "3.18.6",
        maintainers = @CSVMetadata.Maintainer(name = "The Apache Software Foundation", email = "users@camel.apache.org"),
        provider = @CSVMetadata.Provider(name = "The Apache Software Foundation"),
        maturity = "alpha",
        requiredCRDs = {
                @CSVMetadata.RequiredCRD(name = "pipelines.tekton.dev", version = "apiextensions.k8s.io/v1", kind = "CustomResourceDefinition"),
                @CSVMetadata.RequiredCRD(name = "tasks.tekton.dev", version = "apiextensions.k8s.io/v1", kind = "CustomResourceDefinition")
        }
)
public class KaravanOperatorCSVMetadata implements SharedCSVMetadata {
}

// TODO: Prepared for quarkus-operator-sdk 4.0.4+
//package org.apache.camel.karavan.operator.spec;
//
//        import io.quarkiverse.operatorsdk.bundle.runtime.CSVMetadata;
//        import io.quarkiverse.operatorsdk.bundle.runtime.SharedCSVMetadata;
//
//@CSVMetadata(
//        name = "camel-karavan-operator.v3.18.6",
//        annotations = @CSVMetadata.Annotations(
//                containerImage = "ghcr.io/apache/camel-karavan-operator:3.18.6",
//                repository = "https://github.com/apache/camel-karavan",
//                capabilities = "Basic Install",
//                categories = "Developer Tools, Integration & Delivery",
//                certified = false,
//                almExamples = "[\n" +
//                        "  {\n" +
//                        "    \"apiVersion\": \"camel.apache.org/v1\",\n" +
//                        "    \"kind\": \"Karavan\",\n" +
//                        "    \"metadata\": {\n" +
//                        "      \"labels\": {\n" +
//                        "        \"app\": \"karavan\"\n" +
//                        "      },\n" +
//                        "      \"name\": \"karavan\"\n" +
//                        "    },\n" +
//                        "    \"spec\": {\n" +
//                        "      \"instances\": 1,\n" +
//                        "      \"auth\": \"public\",\n" +
//                        "      \"type\": \"dev\"\n" +
//                        "    }\n" +
//                        "  }\n" +
//                        "]"
//        ),
//        displayName = "Camel Karavan Operator",
//        description = "Apache Camel Karavan\n" +
//                "====================\n" +
//                "Karavan is an Integration Toolkit for Apache Camel, which makes integration easy and fun through the visualization of pipelines,\n" +
//                "integration with runtimes and package, image build and deploy to kubernetes out-of-the-box.\n" +
//                "\n" +
//                "## Installation\n" +
//                "\n" +
//                "1. Install Apache Camel Karavan Operator\n" +
//                "2. Install Tekton operator\n" +
//                "3. Create namespace, ex: `karavan`\n" +
//                "4. Create `Secret` in the namespace, ex:\n" +
//                "```\n" +
//                "kind: Secret\n" +
//                "apiVersion: v1\n" +
//                "metadata:\n" +
//                "  name: karavan\n" +
//                "  namespace: karavan\n" +
//                "type: Opaque\n" +
//                "stringData:\n" +
//                "  master-password: karavan\n" +
//                "  oidc-secret: secret\n" +
//                "  oidc-server-url: https://hostname/auth/realms/karavan\n" +
//                "  oidc-frontend-url: https://hostname/auth\n" +
//                "  projects-git-repository: https://github.com/repository/projects.git\n" +
//                "  projects-git-password: password\n" +
//                "  projects-git-username: username\n" +
//                "  projects-git-branch: main\n" +
//                "  kamelets-git-repository: https://github.com/repository/kamelets.git\n" +
//                "  kamelets-git-password: password\n" +
//                "  kamelets-git-username: username\n" +
//                "  kamelets-git-branch: main\n" +
//                "  image-registry: image-registry.openshift-image-registry.svc:5000\n" +
//                "```\n" +
//                "5. Create `Karavan` instance in the namespace, ex:\n" +
//                "```\n" +
//                "apiVersion: camel.apache.org/v1\n" +
//                "kind: Karavan\n" +
//                "metadata:\n" +
//                "  name: karavan\n" +
//                "  namespace: karavan\n" +
//                "spec:\n" +
//                "  instances: 1\n" +
//                "  auth: public\n" +
//                "```\n",
//        permissionRules = {
//                @CSVMetadata.PermissionRule(apiGroups = "camel.apache.org", resources = {"karavans", "karavans/status", "karavans/finalizers"}),
//                @CSVMetadata.PermissionRule(apiGroups = "rbac.authorization.k8s.io", resources = {"roles", "rolebindings", "clusterroles", "clusterrolebindings"}),
//                @CSVMetadata.PermissionRule(apiGroups = {"image.openshift.io"}, resources = {"imagestreams", "imagestreams/layers"}),
//                @CSVMetadata.PermissionRule(apiGroups = {"route.openshift.io"}, resources = {"routes"}),
//                @CSVMetadata.PermissionRule(apiGroups = {"networking.k8s.io"}, resources = {"ingresses"}),
//                @CSVMetadata.PermissionRule(apiGroups = {"apps"}, resources = {"deployments"}),
//                @CSVMetadata.PermissionRule(apiGroups = {""}, resources = {"serviceaccounts", "secrets", "configmaps", "services", "persistentvolumes", "persistentvolumeclaims"}),
//                @CSVMetadata.PermissionRule(apiGroups = {"operators.coreos.com"}, resources = {"subscriptions"}, verbs = {"get", "list", "watch"}),
//                @CSVMetadata.PermissionRule(apiGroups = {"tekton.dev"}, resources = {"tasks", "pipelines"}),
//                @CSVMetadata.PermissionRule(apiGroups = {"apiextensions.k8s.io"}, resources = {"customresourcedefinitions"}, verbs = {"get", "list", "watch"}),
//        },
//        keywords = {"apache", "camel", "karavan", "integration", "microservices", "low-code"},
//        version = "3.18.6",
//        maintainers = @CSVMetadata.Maintainer(name = "The Apache Software Foundation", email = "users@camel.apache.org"),
//        provider = @CSVMetadata.Provider(name = "The Apache Software Foundation"),
//        maturity = "alpha",
//        minKubeVersion = "1.11.0",
//        icon = @CSVMetadata.Icon(
//                base64data = "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiBpZD0ic3ZnNTAiIHdpZHRoPSIyNTYiIGhlaWdodD0iMjU2IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCIgdmVyc2lvbj0iMS4xIiB2aWV3Qm94PSIwIDAgMjU2IDI1NiIgY2xhc3M9ImxvZ28iPjxkZWZzIGlkPSJkZWZzMzEiPjxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyR3JhZGllbnQxMzUxIj48c3RvcCBpZD0ic3RvcDEzNDciIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2RjZmZmZiIgc3RvcC1vcGFjaXR5PSIxIj48L3N0b3A+PHN0b3AgaWQ9InN0b3AxMzQ5IiBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM5NmQyZTYiIHN0b3Atb3BhY2l0eT0iMSI+PC9zdG9wPjwvbGluZWFyR3JhZGllbnQ+PGNpcmNsZSBpZD0icGF0aC0xIiBjeD0iMTI4IiBjeT0iMTI4IiByPSIxMjgiPjwvY2lyY2xlPjxsaW5lYXJHcmFkaWVudCBpZD0ibGluZWFyR3JhZGllbnQtMyIgeDE9Ii0yNi4wNTEiIHgyPSIyNTQuMzE2IiB5MT0iMjcxLjMzMSIgeTI9IjAuMDQ4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3AgaWQ9InN0b3AxMCIgb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzQ3OTBiYiIgc3RvcC1vcGFjaXR5PSIxIj48L3N0b3A+PHN0b3AgaWQ9InN0b3AxMiIgb2Zmc2V0PSIxMC45OTYlIiBzdG9wLWNvbG9yPSIjNjRiN2RiIiBzdG9wLW9wYWNpdHk9IjEiPjwvc3RvcD48c3RvcCBpZD0ic3RvcDE0IiBvZmZzZXQ9Ijk0LjUwMiUiIHN0b3AtY29sb3I9IiMzMjZlYTAiIHN0b3Atb3BhY2l0eT0iMSI+PC9zdG9wPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJsaW5lYXJHcmFkaWVudC00IiB4MT0iLTMyLjE2MyIgeDI9IjI1OS4zMzgiIHkxPSIyNzcuMDI5IiB5Mj0iLTUuMDI4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHN0b3AgaWQ9InN0b3AxNyIgb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iI0Y2OTkyMyI+PC9zdG9wPjxzdG9wIGlkPSJzdG9wMTkiIG9mZnNldD0iOC4wNDglIiBzdG9wLWNvbG9yPSIjRjc5QTIzIj48L3N0b3A+PHN0b3AgaWQ9InN0b3AyMSIgb2Zmc2V0PSI0MS44NzQlIiBzdG9wLWNvbG9yPSIjRTk3ODI2Ij48L3N0b3A+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhckdyYWRpZW50LTUiIHgxPSIyMTcuOTQ1IiB4Mj0iOTkuNDU5IiB5MT0iNjcuNTA1IiB5Mj0iMjQ3LjAwNSIgZ3JhZGllbnRUcmFuc2Zvcm09InNjYWxlKC45NjQ0MiAxLjAzNjkpIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeGxpbms6aHJlZj0iI2xpbmVhckdyYWRpZW50LTQiPjxzdG9wIGlkPSJzdG9wMjQiIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiM5MmQ2ZDUiIHN0b3Atb3BhY2l0eT0iMSI+PC9zdG9wPjxzdG9wIGlkPSJzdG9wMjYiIG9mZnNldD0iNDEuMTkxJSIgc3RvcC1jb2xvcj0iIzc5YjdjYyIgc3RvcC1vcGFjaXR5PSIxIj48L3N0b3A+PHN0b3AgaWQ9InN0b3AyOCIgb2Zmc2V0PSI3My4yNzElIiBzdG9wLWNvbG9yPSIjNTg5MWM1IiBzdG9wLW9wYWNpdHk9IjEiPjwvc3RvcD48L2xpbmVhckdyYWRpZW50PjxtYXNrIGlkPSJtYXNrLTIiIGZpbGw9IiNmZmYiPjx1c2UgaWQ9InVzZTMzIiB4bGluazpocmVmPSIjcGF0aC0xIj48L3VzZT48L21hc2s+PG1hc2sgaWQ9Im1hc2stMi03IiBmaWxsPSIjZmZmIj48dXNlIGlkPSJ1c2UxMzciIHhsaW5rOmhyZWY9IiNwYXRoLTEiPjwvdXNlPjwvbWFzaz48bGluZWFyR3JhZGllbnQgaWQ9ImxpbmVhckdyYWRpZW50MTM0NSIgeDE9IjIzMy4xMjIiIHgyPSIyLjI0IiB5MT0iNTYuMDE1IiB5Mj0iMjQyLjc4IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgeGxpbms6aHJlZj0iI2xpbmVhckdyYWRpZW50MTM1MSI+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBpZD0iY2lyY2xlMzgiIGN4PSIxMjcuOTk0IiBjeT0iMTI3Ljk5NCIgcj0iMTIzLjExMSIgZmlsbD0idXJsKCNsaW5lYXJHcmFkaWVudC0zKSIgZmlsbC1ydWxlPSJub256ZXJvIiBtYXNrPSJ1cmwoI21hc2stMikiPjwvY2lyY2xlPjxnIGlkPSJnMjI2NiI+PHBhdGggaWQ9InBhdGg0MiIgZmlsbD0idXJsKCNsaW5lYXJHcmFkaWVudC01KSIgZmlsbC1vcGFjaXR5PSIxIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik05OC4wNDQgNzUuNTE3Yy0xLjc1MS0uMDAyLTMuNTI0LjAxLTUuMjkyLjA2MS0yLjA1Ni4wNi00LjgxNy43MTMtOCAxLjc4NSA1My43NzUgNDAuODM0IDczLjEwOCAxMTQuNDk3IDM5Ljg3NSAxNzguNTE0IDEuMTI5LjAzIDIuMjQ5LjEyMyAzLjM4NS4xMjMgNjAuNzM2IDAgMTExLjQ5Mi00Mi4zMjMgMTI0LjYwOS05OS4wNzEtMzguNTQyLTQ1LjE3OC05MC44MTMtODEuMzE0LTE1NC41NzgtODEuNDEyeiIgbWFzaz0idXJsKCNtYXNrLTIpIiBvcGFjaXR5PSIwLjc1Ij48L3BhdGg+PC9nPjxwYXRoIGlkPSJwYXRoNDQiIGZpbGw9IiMxZTRiN2IiIGZpbGwtb3BhY2l0eT0iMSIgZmlsbC1ydWxlPSJub256ZXJvIiBkPSJNODQuNzUyIDc3LjM2OEM2Ni44OTUgODMuMzc4IDMyLjgzIDEwNC41NDYuMDc5IDEzMi44MWMyLjQ4NyA2Ny4zMzQgNTcuMDI4IDEyMS4zMTMgMTI0LjU0OCAxMjMuMDcgMzMuMjMzLTY0LjAxNiAxMy45MDEtMTM3LjY4LTM5Ljg3NS0xNzguNTEzeiIgbWFzaz0idXJsKCNtYXNrLTIpIiBvcGFjaXR5PSIwLjc1Ij48L3BhdGg+PHBhdGggaWQ9InBhdGgxNTAiIGZpbGw9InVybCgjbGluZWFyR3JhZGllbnQxMzQ1KSIgZmlsbC1vcGFjaXR5PSIxIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0xMjguNzQ3IDU0LjAwNWMtMTAuOTg1IDUuNDk1IDAgMjcuNDY2IDAgMjcuNDY2Qzk1Ljc3NCAxMDguOTU0IDEwMi43OCAxNTUuOSA2NC4zMTIgMTU1LjljLTIwLjk3IDAtNDIuMjQyLTI0LjA3Ny02NC4yMzMtMzguODI4LS4yODMgMy40NzktLjc4NSA2Ljk3Mi0uNzg1IDEwLjUyNCAwIDQ4LjA5NSAyNi4yNjMgODkuOTI0IDY1LjQyIDExMS44OTcgMTAuOTUyLTEuMzggMjIuODM4LTQuMTE0IDMxLjA1LTkuNTkyIDQzLjE0Ni0yOC43NjUgNTMuODU3LTgzLjQ5MSA3MS40ODctMTA5LjkyNSAxMC45NzktMTYuNDkyIDYyLjQzNC0xNS4wNjEgNjUuOTA2LTIyLjAxIDUuNTAyLTEwLjk5MS0xMC45OS0yNy40NjctMTYuNDkxLTI3LjQ2N2gtNDMuOTU4Yy0zLjA3MSAwLTcuODk3LTUuNDU2LTEwLjk3NC01LjQ1NmgtMTYuNDkycy03LjMwNy0xMS4wODUtMTMuNzk0LTExLjUyNmMtLjkzLS4wNjYtMS44My4wNTMtMi43LjQ4OHoiIG1hc2s9InVybCgjbWFzay0yLTcpIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtLjc2OSAtLjEzMykiPjwvcGF0aD48cGF0aCBpZD0icGF0aDQwIiBmaWxsPSIjMmQ0MTUwIiBmaWxsLW9wYWNpdHk9IjEiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTEyOCAyNTZDNTcuMzA4IDI1NiAwIDE5OC42OTIgMCAxMjggMCA1Ny4zMDggNTcuMzA4IDAgMTI4IDBjNzAuNjkyIDAgMTI4IDU3LjMwOCAxMjggMTI4IDAgNzAuNjkyLTU3LjMwOCAxMjgtMTI4IDEyOHptMC05Ljc2OGM2NS4yOTggMCAxMTguMjMyLTUyLjkzNCAxMTguMjMyLTExOC4yMzJTMTkzLjI5OCA5Ljc2OCAxMjggOS43NjggOS43NjggNjIuNzAyIDkuNzY4IDEyOCA2Mi43MDIgMjQ2LjIzMiAxMjggMjQ2LjIzMnoiIG1hc2s9InVybCgjbWFzay0yKSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLS41OSkgc2NhbGUoMS4wMDA3OCkiPjwvcGF0aD48L3N2Zz4="
//        ),
//        installModes = {
//                @CSVMetadata.InstallMode(type = "AllNamespaces")
//        },
//        links =  {
//                @CSVMetadata.Link(name = "Apache Camel Karavan source code repository", url = "https://github.com/apache/camel-karavan")
//        }
//)
//public class KaravanOperatorCSVMetadata implements SharedCSVMetadata {
//}

