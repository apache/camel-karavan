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

import jakarta.validation.constraints.NotBlank;

import java.io.Serial;
import java.io.Serializable;
import java.time.Instant;
import java.util.Arrays;

public class Project implements Serializable {

    @Serial
    private static final long serialVersionUID = 7777777L;
    public static final String CACHE = "projects";

    public enum Type {

        templates,
        kamelets,
        services,
        normal,
        ephemeral,
    }

    @NotBlank
    String projectId;
    @NotBlank
    String name;
    @NotBlank
    String description;
    String lastCommit;
    Long lastCommitTimestamp;
    Type type;

    public Project(String projectId, String name, String description, String lastCommit, Long lastCommitTimestamp, Type type) {
        this.projectId = projectId;
        this.name = name;
        this.description = description;
        this.lastCommit = lastCommit;
        this.lastCommitTimestamp = lastCommitTimestamp;
        this.type = type;
    }

    public Project(String projectId, String name, String description, String lastCommit, Long lastCommitTimestamp) {
        this.projectId = projectId;
        this.name = name;
        this.description = description;
        this.lastCommit = lastCommit;
        this.lastCommitTimestamp = lastCommitTimestamp;
        this.type = Arrays.stream(Type.values()).anyMatch(t -> t.name().equals(projectId)) ? Type.valueOf(projectId) : Type.normal;
    }

    public Project(String projectId, String name, String description) {
        this.projectId = projectId;
        this.name = name;
        this.description = description;
        this.lastCommitTimestamp = Instant.now().toEpochMilli();
        this.type = Arrays.stream(Type.values()).anyMatch(t -> t.name().equals(projectId)) ? Type.valueOf(projectId) : Type.normal;
    }

    public Project() {
        this.type = Type.normal;
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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLastCommit() {
        return lastCommit;
    }

    public void setLastCommit(String lastCommit) {
        this.lastCommit = lastCommit;
    }

    public Long getLastCommitTimestamp() {
        return lastCommitTimestamp;
    }

    public void setLastCommitTimestamp(Long lastCommitTimestamp) {
        this.lastCommitTimestamp = lastCommitTimestamp;
    }

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

}
