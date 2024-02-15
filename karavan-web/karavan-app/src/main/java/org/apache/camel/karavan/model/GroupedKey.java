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

import java.io.Serial;
import java.io.Serializable;

public class GroupedKey implements Serializable {

    @Serial
    private static final long serialVersionUID = 7777777L;

    private String projectId;
    private String env;
    private String key;

    public GroupedKey(String projectId, String env, String key) {
        this.projectId = projectId;
        this.env = env;
        this.key = key;
    }

    public static String create(String projectId, String env, String key) {
        return new GroupedKey(projectId, env, key).getCacheKey();
    }

    public String getEnv() {
        return env;
    }

    public String getKey() {
        return key;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public void setKey(String key) {
        this.key = key;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;

        GroupedKey that = (GroupedKey) o;

        if (!projectId.equals(that.projectId)) return false;
        if (!env.equals(that.env)) return false;
        return key.equals(that.key);
    }

    public String getCacheKey() {
        return projectId + ":" + env + ":" + key;
    }

    @Override
    public int hashCode() {
        return getCacheKey().hashCode();
    }

    @Override
    public String toString() {
        return "GroupedKey{" + getCacheKey() + '}';
    }
}