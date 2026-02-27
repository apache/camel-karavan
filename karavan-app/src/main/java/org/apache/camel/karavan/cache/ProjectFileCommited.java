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

public class ProjectFileCommited {

    String name;
    String code;
    String projectId;
    String commitId;
    Long commitTime;

    public ProjectFileCommited(String name, String code, String projectId, String commitId, Long commitTime) {
        this.name = name;
        this.code = code;
        this.projectId = projectId;
        this.commitId = commitId;
        this.commitTime = commitTime;
    }

    public ProjectFileCommited() {
    }

    public static ProjectFileCommited fromFile(ProjectFile file, String commitId) {
        var fileCommited = new ProjectFileCommited();
        fileCommited.name = file.getName();
        fileCommited.code = file.getCode();
        fileCommited.projectId = file.getProjectId();
        fileCommited.commitTime = file.getLastUpdate();
        fileCommited.commitId = commitId;
        return fileCommited;
    }

    public String getCommitId() {
        return commitId;
    }

    public void setCommitId(String commitId) {
        this.commitId = commitId;
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

    public Long getCommitTime() {
        return commitTime;
    }

    public void setCommitTime(Long commitTime) {
        this.commitTime = commitTime;
    }

    public ProjectFileCommited copy() {
        return new ProjectFileCommited(name, code, projectId, commitId, commitTime);
    }

    @Override
    public String toString() {
        return "ProjectFileCommited{" +
                "name='" + name + '\'' +
                ", code='" + code + '\'' +
                ", projectId='" + projectId + '\'' +
                ", lastUpdate=" + commitTime +
                '}';
    }
}
