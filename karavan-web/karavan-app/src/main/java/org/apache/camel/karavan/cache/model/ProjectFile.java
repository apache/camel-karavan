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

public class ProjectFile implements Serializable {

    @Serial
    private static final long serialVersionUID = 7777777L;
    public static final String CACHE = "project_files";
    String name;
    String code;
    String projectId;
    Long lastUpdate;

    public ProjectFile(String name, String code, String projectId, Long lastUpdate) {
        this.name = name;
        this.code = code;
        this.projectId = projectId;
        this.lastUpdate = lastUpdate;
    }

    public ProjectFile() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Long getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(Long lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    @Override
    public String toString() {
        return "ProjectFile{" +
                "name='" + name + '\'' +
                ", code='" + code + '\'' +
                ", projectId='" + projectId + '\'' +
                ", lastUpdate=" + lastUpdate +
                '}';
    }
}
