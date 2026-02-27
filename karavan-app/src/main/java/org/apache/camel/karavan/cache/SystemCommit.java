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

import java.util.List;

public class SystemCommit {
    private String id;
    private String authorName;
    private String authorEmail;
    private Long commitTime;
    private String message;
    private List<String> projectIds;

    public SystemCommit() {
    }

    public SystemCommit(String id, String authorName, String authorEmail, Long commitTime, String message, List<String> projectIds) {
        this.id = id;
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.commitTime = commitTime;
        this.message = message;
        this.projectIds = projectIds;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
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

    public Long getCommitTime() {
        return commitTime;
    }

    public void setCommitTime(Long commitTime) {
        this.commitTime = commitTime;
    }

    public List<String> getProjectIds() {
        return projectIds;
    }

    public void setProjectIds(List<String> projectIds) {
        this.projectIds = projectIds;
    }

    @Override
    public String toString() {
        return "SystemCommit{" +
                "id='" + id + '\'' +
                ", authorName='" + authorName + '\'' +
                ", authorEmail='" + authorEmail + '\'' +
                ", message='" + message + '\'' +
                ", commitTime='" + commitTime + '\'' +
                '}';
    }
}
