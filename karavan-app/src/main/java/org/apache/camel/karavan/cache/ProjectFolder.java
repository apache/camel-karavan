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

import org.infinispan.api.annotations.indexing.Basic;
import org.infinispan.api.annotations.indexing.Indexed;
import org.infinispan.api.annotations.indexing.Keyword;
import org.infinispan.protostream.annotations.ProtoEnumValue;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;

@Indexed
public class ProjectFolder {

    public enum Type {

        @ProtoEnumValue(number = 0, name = "templates")
        templates,
        @ProtoEnumValue(number = 1, name = "kamelets")
        kamelets,
        @ProtoEnumValue(number = 2, name = "configuration")
        configuration,
        @ProtoEnumValue(number = 3, name = "documentation")
        documentation,
        @ProtoEnumValue(number = 4, name = "shared")
        shared,
        @ProtoEnumValue(number = 5, name = "services")
        services,
        @ProtoEnumValue(number = 6, name = "integration")
        integration,
    }

    @Keyword(projectable = true, sortable = true)
    @ProtoField(1)
    String projectId;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(2)
    String name;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(3)
    String lastCommit;
    @Basic(projectable = true, sortable = true)
    @ProtoField(4)
    Long lastCommitTimestamp;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(5)
    Type type;

    @ProtoFactory
    public ProjectFolder(String projectId, String name, String lastCommit, Long lastCommitTimestamp, Type type) {
        this.projectId = projectId;
        this.name = name;
        this.lastCommit = lastCommit;
        this.lastCommitTimestamp = lastCommitTimestamp;
        this.type = type;
    }

    public ProjectFolder(String projectId, String name, String lastCommit, Long lastCommitTimestamp) {
        this.projectId = projectId;
        this.name = name;
        this.lastCommit = lastCommit;
        this.lastCommitTimestamp = lastCommitTimestamp;
        this.type = Arrays.stream(Type.values()).anyMatch(t -> t.name().equals(projectId)) ? Type.valueOf(projectId) : Type.integration;
    }

    public ProjectFolder(String projectId, String name) {
        this.projectId = projectId;
        this.name = name;
        this.lastCommitTimestamp = Instant.now().toEpochMilli();
        this.type = Arrays.stream(Type.values()).anyMatch(t -> t.name().equals(projectId)) ? Type.valueOf(projectId) : Type.integration;
    }

    public ProjectFolder copy() {
        return new ProjectFolder(projectId, name, lastCommit, lastCommitTimestamp, type);
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

    public static List<String> getBuildInNames(){
        return List.of(
            Type.configuration.name(),
            Type.kamelets.name(),
            Type.templates.name(),
            Type.shared.name(),
            Type.documentation.name()
        );
    }

    @Override
    public String toString() {
        return "Project{" +
                "projectId='" + projectId + '\'' +
                ", name='" + name + '\'' +
                ", lastCommit='" + lastCommit + '\'' +
                ", lastCommitTimestamp=" + lastCommitTimestamp +
                ", type=" + type +
                '}';
    }
}
