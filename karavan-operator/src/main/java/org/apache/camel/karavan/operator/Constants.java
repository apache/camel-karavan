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
package org.apache.camel.karavan.operator;

public final class Constants {
    public static final String CRD_GROUP = "camel.apache.org";
    public static final String CRD_VERSION = "v1";
    public static final String SHORT_NAME = "karavan";
    public static final String NAME = "karavan";
    public static final String PLURAL_NAME = "karavans";

    public static final String SERVICEACCOUNT_KARAVAN = "karavan";
    public static final String ROLE_KARAVAN = "karavan";
    public static final String ROLEBINDING_KARAVAN = "karavan";
    public static final String ROLEBINDING_KARAVAN_VIEW = "karavan-view";
    public static final String PVC_DATA = "karavan-data";
    public static final String PVC_M2_CACHE = "karavan-m2-cache";
    public static final String PVC_JBANG_CACHE = "karavan-jbang-cache";

    public static final String PIPELINE_DEV = "karavan-pipeline-dev-";
    public static final String TASK_DEV = "karavan-task-dev-";

    public static final String ROLE_PIPELINE_DEPLOYER = "deployer";
    public static final String SERVICEACCOUNT_PIPELINE = "pipeline";
    public static final String ROLEBINDING_PIPELINE_DEPLOYER = "pipeline-deployer";
}