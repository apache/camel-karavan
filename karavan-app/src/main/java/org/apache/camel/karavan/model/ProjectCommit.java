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

package org.apache.camel.karavan.model;

import java.util.ArrayList;
import java.util.List;

public class ProjectCommit {
    private String id;
    private String projectId;
    private String authorName;
    private String authorEmail;
    private String message;
    private List<ProjectFileCommitDiff> diffs = new ArrayList<>();

    public ProjectCommit() {
    }

    public ProjectCommit(String id, String projectId, String authorName, String authorEmail, String message, List<ProjectFileCommitDiff> diffs) {
        this.id = id;
        this.projectId = projectId;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.message = message;
        this.diffs = diffs;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getAuthorName() {
        return authorName;
    }

    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }

    public String getAuthorEmail() {
        return authorEmail;
    }

    public void setAuthorEmail(String authorEmail) {
        this.authorEmail = authorEmail;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<ProjectFileCommitDiff> getDiffs() {
        return diffs;
    }

    public void setDiffs(List<ProjectFileCommitDiff> diffs) {
        this.diffs = diffs;
    }
}
