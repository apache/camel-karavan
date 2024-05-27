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
package org.apache.camel.karavan.status;

public class StatusEvents {

    public static final String CMD_COLLECT_CAMEL_STATUS = "CMD_COLLECT_CAMEL_STATUS";
    public static final String CMD_COLLECT_CONTAINER_STATISTIC = "CMD_COLLECT_CONTAINER_STATISTIC";
    public static final String CMD_CLEAN_STATUSES = "CMD_CLEAN_STATUSES";

    public static final String CONTAINER_UPDATED = "CONTAINER_UPDATED";
    public static final String CONTAINER_DELETED = "CONTAINER_DELETED";

    public static final String DEPLOYMENT_UPDATED = "DEPLOYMENT_UPDATED";
    public static final String DEPLOYMENT_DELETED = "DEPLOYMENT_DELETED";

    public static final String SERVICE_UPDATED = "SERVICE_UPDATED";
    public static final String SERVICE_DELETED = "SERVICE_DELETED";
}