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

public class ServiceStatus implements Serializable {

    @Serial
    private static final long serialVersionUID = 7777777L;
    public static final String CACHE = "service_statuses";
    String projectId;
    String namespace;
    String env;
    String cluster;
    Integer port;
    Integer targetPort;
    String clusterIP;
    String type;

    public ServiceStatus(String projectId, String namespace, String env, String cluster, Integer port, Integer targetPort, String clusterIP, String type) {
        this.projectId = projectId;
        this.namespace = namespace;
        this.env = env;
        this.cluster = cluster;
        this.port = port;
        this.targetPort = targetPort;
        this.clusterIP = clusterIP;
        this.type = type;
    }

    public ServiceStatus(String projectId, String namespace, String cluster, String env) {
        this.projectId = projectId;
        this.namespace = namespace;
        this.env = env;
        this.cluster = cluster;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
    }

    public String getEnv() {
        return env;
    }

    public void setEnv(String env) {
        this.env = env;
    }

    public String getCluster() {
        return cluster;
    }

    public void setCluster(String cluster) {
        this.cluster = cluster;
    }

    public Integer getPort() {
        return port;
    }

    public void setPort(Integer port) {
        this.port = port;
    }

    public Integer getTargetPort() {
        return targetPort;
    }

    public void setTargetPort(Integer targetPort) {
        this.targetPort = targetPort;
    }

    public String getClusterIP() {
        return clusterIP;
    }

    public void setClusterIP(String clusterIP) {
        this.clusterIP = clusterIP;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
