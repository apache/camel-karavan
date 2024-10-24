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

public class ProjectFileCommitDiff {
    private String changeType;
    private String newPath;
    private String oldPath;
    private String diff;


    public ProjectFileCommitDiff() {
    }

    public ProjectFileCommitDiff(String changeType, String newPath, String oldPath, String diff) {
        this.changeType = changeType;
        this.newPath = newPath;
        this.oldPath = oldPath;
        this.diff = diff;
    }

    public String getChangeType() {
        return changeType;
    }

    public String getNewPath() {
        return newPath;
    }

    public String getOldPath() {
        return oldPath;
    }

    public String getDiff() {
        return diff;
    }
}
