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

package org.apache.camel.karavan.cache.model;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

public class CamelStatus implements Serializable {

    @Serial
    private static final long serialVersionUID = 7777777L;

    public static final String CACHE = "camel_statuses";
    String projectId;
    String containerName;
    List<CamelStatusValue> statuses;
    String env;

    public CamelStatus(String projectId, String containerName, List<CamelStatusValue> statuses, String env) {
        this.projectId = projectId;
        this.containerName = containerName;
        this.statuses = statuses;
        this.env = env;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getContainerName() {
        return containerName;
    }

    public void setContainerName(String containerName) {
        this.containerName = containerName;
    }

    public List<CamelStatusValue> getStatuses() {
        return statuses;
    }

    public void setStatuses(List<CamelStatusValue> statuses) {
        this.statuses = statuses;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }
}
