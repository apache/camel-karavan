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
import org.infinispan.api.annotations.indexing.Text;
import org.infinispan.protostream.annotations.ProtoFactory;
import org.infinispan.protostream.annotations.ProtoField;

@Indexed
public class ProjectFileCommited {

    @Keyword(projectable = true, sortable = true)
    @ProtoField(1)
    String name;
    @Text
    @ProtoField(2)
    String code;
    @Keyword(projectable = true, sortable = true)
    @ProtoField(3)
    String projectId;
    @Basic(projectable = true, sortable = true)
    @ProtoField(4)
    Long lastUpdate;
    @Basic(projectable = true, sortable = true)
    @ProtoField(5)
    Long syncDate;

    @ProtoFactory
    public ProjectFileCommited(String name, String code, String projectId, Long lastUpdate, Long syncDate) {
        this.name = name;
        this.code = code;
        this.projectId = projectId;
        this.lastUpdate = lastUpdate;
        this.syncDate = syncDate;
    }

    public ProjectFileCommited() {
    }

    public static ProjectFileCommited fromFile(ProjectFile file) {
        var fileCommited = new ProjectFileCommited();
        fileCommited.name = file.getName();
        fileCommited.code = file.getCode();
        fileCommited.projectId = file.getProjectId();
        fileCommited.lastUpdate = file.getLastUpdate();
        return fileCommited;
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

    public Long getSyncDate() {
        return syncDate;
    }

    public void setSyncDate(Long syncDate) {
        this.syncDate = syncDate;
    }

    public ProjectFileCommited copy() {
        return new ProjectFileCommited(name, code, projectId, lastUpdate, syncDate);
    }

    @Override
    public String toString() {
        return "ProjectFileCommited{" +
                "name='" + name + '\'' +
                ", code='" + code + '\'' +
                ", projectId='" + projectId + '\'' +
                ", lastUpdate=" + lastUpdate +
                '}';
    }
}
