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


import java.io.Serial;
import java.io.Serializable;

public class DeploymentStatus implements Serializable {

    @Serial
    private static final long serialVersionUID = 7777777L;

    public static final String CACHE = "deployment_statuses";
    String projectId;
    String namespace;
    String env;
    String cluster;
    String image;
    Integer replicas;
    Integer readyReplicas;
    Integer unavailableReplicas;

    public DeploymentStatus(String projectId, String namespace, String cluster, String env) {
        this.projectId = projectId;
        this.namespace = namespace;
        this.cluster = cluster;
        this.env = env;
        this.image = "";
        this.replicas = 0;
        this.readyReplicas = 0;
        this.unavailableReplicas = 0;
    }

    public DeploymentStatus(String projectId, String namespace, String cluster, String env, String image, Integer replicas, Integer readyReplicas, Integer unavailableReplicas) {
        this.projectId = projectId;
        this.namespace = namespace;
        this.env = env;
        this.cluster = cluster;
        this.image = image;
        this.replicas = replicas;
        this.readyReplicas = readyReplicas;
        this.unavailableReplicas = unavailableReplicas;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public Integer getReplicas() {
        return replicas;
    }

    public void setReplicas(Integer replicas) {
        this.replicas = replicas;
    }

    public Integer getReadyReplicas() {
        return readyReplicas;
    }

    public void setReadyReplicas(Integer readyReplicas) {
        this.readyReplicas = readyReplicas;
    }

    public Integer getUnavailableReplicas() {
        return unavailableReplicas;
    }

    public void setUnavailableReplicas(Integer unavailableReplicas) {
        this.unavailableReplicas = unavailableReplicas;
    }

    public String getCluster() {
        return cluster;
    }

    public void setCluster(String cluster) {
        this.cluster = cluster;
    }
}
