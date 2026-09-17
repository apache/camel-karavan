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

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A single entry of {@code deploy.resources} of the Compose Specification, used both for
 * {@code limits} and for {@code reservations}. Values are kept as the raw Compose strings
 * ("1.5", "512m", ...) and converted to the units the Docker Daemon expects when the
 * HostConfig is built.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DockerResourceSpecDefinition {

    private String cpus;
    private String memory;
    private String pids;

    public DockerResourceSpecDefinition() {
    }

    public DockerResourceSpecDefinition(String cpus, String memory, String pids) {
        this.cpus = cpus;
        this.memory = memory;
        this.pids = pids;
    }

    public String getCpus() {
        return cpus;
    }

    public void setCpus(String cpus) {
        this.cpus = cpus;
    }

    public String getMemory() {
        return memory;
    }

    public void setMemory(String memory) {
        this.memory = memory;
    }

    public String getPids() {
        return pids;
    }

    public void setPids(String pids) {
        this.pids = pids;
    }

    @Override
    public String toString() {
        return "DockerResourceSpecDefinition {" +
                "cpus='" + cpus + '\'' +
                ", memory='" + memory + '\'' +
                ", pids='" + pids + '\'' +
                '}';
    }
}
