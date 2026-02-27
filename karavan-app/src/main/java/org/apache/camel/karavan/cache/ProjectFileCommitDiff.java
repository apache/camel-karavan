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

public class ProjectFileCommitDiff {
    private String changeType;
    private String newPath;
    private String oldPath;
    private String diff;
    private String before;
    private String after;


    public ProjectFileCommitDiff() {
    }

    public ProjectFileCommitDiff(String changeType, String newPath, String oldPath, String diff, String before, String after) {
        this.changeType = changeType;
        this.newPath = newPath;
        this.oldPath = oldPath;
        this.diff = diff;
        this.before = before;
        this.after = after;
    }

    public String getChangeType() {
        return changeType;
    }

    public void setChangeType(String changeType) {
        this.changeType = changeType;
    }

    public String getNewPath() {
        return newPath;
    }

    public void setNewPath(String newPath) {
        this.newPath = newPath;
    }

    public String getOldPath() {
        return oldPath;
    }

    public void setOldPath(String oldPath) {
        this.oldPath = oldPath;
    }

    public String getDiff() {
        return diff;
    }

    public void setDiff(String diff) {
        this.diff = diff;
    }

    public String getBefore() {
        return before;
    }

    public void setBefore(String before) {
        this.before = before;
    }

    public String getAfter() {
        return after;
    }

    public void setAfter(String after) {
        this.after = after;
    }

    @Override
    public String toString() {
        return "ProjectFileCommitDiff{" +
                "changeType='" + changeType + '\'' +
                ", newPath='" + newPath + '\'' +
                ", oldPath='" + oldPath + '\'' +
                ", diff='" + diff + '\'' +
                '}';
    }
}
