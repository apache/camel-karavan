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
package org.apache.camel.karavan.installer;

public final class Constants {
    public static final String DEFAULT_NAMESPACE = "karavan";
    public static final String DEFAULT_ENVIRONMENT = "dev";
    public static final String DEFAULT_AUTH = "public";

    public static final String  DEFAULT_GIT_REPOSITORY = "http://gitea:3000/karavan/karavan.git";
    public static final String  DEFAULT_GIT_USERNAME = "karavan";
    public static final String  DEFAULT_GIT_PASSWORD = "karavan";
    public static final String  DEFAULT_GIT_BRANCH = "main";

    public static final String DEFAULT_IMAGE_REGISTRY_OPENSHIFT = "image-registry.openshift-image-registry.svc:5000";
    public static final String DEFAULT_DEVMODE_IMAGE = "ghcr.io/apache/camel-karavan-devmode";

    public static final String KARAVAN_IMAGE = "ghcr.io/apache/camel-karavan";

    public static final String NAME = "karavan";

    public static final String SERVICEACCOUNT_KARAVAN = "karavan";
    public static final String ROLE_KARAVAN = "karavan";
    public static final String ROLEBINDING_KARAVAN = "karavan-role-binding";
    public static final String ROLEBINDING_KARAVAN_VIEW = "karavan-cluster-role-binding";

    public static final String KEYCLOAK_URL = "karavan.keycloak.url";
    public static final String KEYCLOAK_REALM = "karavan.keycloak.realm";
    public static final String KEYCLOAK_FRONTEND_CLIENT_ID = "karavan.keycloak.frontend.clientId";
    public static final String KEYCLOAK_BACKEND_CLIENT_ID = "karavan.keycloak.backend.clientId";
    public static final String KEYCLOAK_BACKEND_SECRET = "karavan.keycloak.backend.secret";
}