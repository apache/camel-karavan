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

import java.util.List;
import java.util.Map;

public class Configuration {
    private String title;
    private String version;
    private String infrastructure;
    private String environment;
    private List<String> environments;
    private List<String> configFilenames;
    private List<Object> status;
    private Map<String, String> advanced;

    public Configuration() {
    }

    public Configuration(String title, String version, String infrastructure, String environment, List<String> environments, List<String> configFilenames,
                         Map<String, String> advanced) {
        this.title = title;
        this.version = version;
        this.infrastructure = infrastructure;
        this.environment = environment;
        this.environments = environments;
        this.configFilenames = configFilenames;
        this.advanced = advanced;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getInfrastructure() {
        return infrastructure;
    }

    public void setInfrastructure(String infrastructure) {
        this.infrastructure = infrastructure;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public List<String> getEnvironments() {
        return environments;
    }

    public void setEnvironments(List<String> environments) {
        this.environments = environments;
    }

    public List<Object> getStatus() {
        return status;
    }

    public void setStatus(List<Object> status) {
        this.status = status;
    }

    public List<String> getConfigFilenames() {
        return configFilenames;
    }

    public void setConfigFilenames(List<String> configFilenames) {
        this.configFilenames = configFilenames;
    }

    public Map<String, String> getAdvanced() {
        return advanced;
    }

    public void setAdvanced(Map<String, String> advanced) {
        this.advanced = advanced;
    }
}
