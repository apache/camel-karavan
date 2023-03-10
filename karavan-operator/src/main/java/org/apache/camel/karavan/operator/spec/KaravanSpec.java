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
package org.apache.camel.karavan.operator.spec;

public class KaravanSpec {

    private int instances;
    private String auth;
    private String environment;
    private String runtimes;
    private int nodePort;
    private String gitPullInterval;

    public KaravanSpec() {
    }

    public KaravanSpec(int instances, String auth, String environment, String runtimes, int nodePort, String gitPullInterval) {
        this.instances = instances;
        this.auth = auth;
        this.environment = environment;
        this.runtimes = runtimes;
        this.nodePort = nodePort;
        this.gitPullInterval = gitPullInterval;
    }

    public int getInstances() {
        return instances;
    }

    public void setInstances(int instances) {
        this.instances = instances;
    }

    public String getAuth() {
        return auth;
    }

    public void setAuth(String auth) {
        this.auth = auth;
    }

    public int getNodePort() {
        return nodePort;
    }

    public void setNodePort(int nodePort) {
        this.nodePort = nodePort;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getRuntimes() {
        return runtimes;
    }

    public void setRuntimes(String runtimes) {
        this.runtimes = runtimes;
    }

    public String getGitPullInterval() {
        return gitPullInterval;
    }

    public void setGitPullInterval(String gitPullInterval) {
        this.gitPullInterval = gitPullInterval;
    }
}
