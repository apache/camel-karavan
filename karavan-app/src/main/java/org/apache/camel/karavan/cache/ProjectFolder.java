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

package org.apache.camel.karavan.cache;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

public class ProjectFolder {

    public enum Type {
        templates,
        kamelets,
        configuration,
        documentation,
        contracts,
        services,
        integration,
        backlog,
    }

    String projectId;
    String name;
    Long lastUpdate = 0L;
    Type type;

    public ProjectFolder(String projectId, String name, Long lastUpdate, Type type) {
        this.projectId = projectId;
        this.name = name;
        this.lastUpdate = lastUpdate;
        this.type = type;
    }

    public ProjectFolder(String projectId, String name, Long lastUpdate) {
        this.projectId = projectId;
        this.name = name;
        this.lastUpdate = lastUpdate;
        this.type = Arrays.stream(Type.values()).anyMatch(t -> t.name().equals(projectId)) ? Type.valueOf(projectId) : Type.integration;
    }

    public ProjectFolder(String projectId, String name) {
        this.projectId = projectId;
        this.name = name;
        this.lastUpdate = Instant.now().getEpochSecond() * 1000L;
        this.type = Arrays.stream(Type.values()).anyMatch(t -> t.name().equals(projectId)) ? Type.valueOf(projectId) : Type.integration;
    }

    public ProjectFolder copy() {
        return new ProjectFolder(projectId, name, lastUpdate, type);
    }

    public ProjectFolder() {
        this.type = Type.integration;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getLastUpdate() {
        return lastUpdate;
    }

    public void setLastUpdate(Long lastUpdate) {
        this.lastUpdate = lastUpdate;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public static List<String> getBuildInNames(){
        return List.of(
                Type.configuration.name(),
                Type.kamelets.name(),
                Type.templates.name(),
                Type.contracts.name(),
                Type.documentation.name(),
                Type.backlog.name()
        );
    }

    @Override
    public String toString() {
        return "Project{" +
                "projectId='" + projectId + '\'' +
                ", name='" + name + '\'' +
                ", lastUpdate=" + lastUpdate +
                ", type=" + type +
                '}';
    }
}