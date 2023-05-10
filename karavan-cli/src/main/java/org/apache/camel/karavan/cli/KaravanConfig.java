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
package org.apache.camel.karavan.cli;

import java.util.Map;

public class KaravanConfig {

    private String version;
    private String namespace;
    private String environment;
    private String runtimes;
    private String auth;
    private int nodePort;
    private String gitPullInterval;
    private int instances;
    private String imageRegistry;
    private String baseImage;
    private String baseBuilderImage;
    private boolean isOpenShift;
    private Map<String,String> labels;

    public static KaravanConfig getDefault(String version) {
        return new KaravanConfig(
                version,
                Constants.DEFAULT_NAMESPACE,
                Constants.DEFAULT_ENVIRONMENT,
                Constants.DEFAULT_RUNTIMES,
                Constants.DEFAULT_AUTH,
                Constants.DEFAULT_NODE_PORT,
                Constants.DEFAULT_GIT_PULL_INTERVAL,
                Constants.DEFAULT_INSTANCES,
                Constants.DEFAULT_IMAGE_REGISTRY,
                Constants.KARAVAN_IMAGE,
                Constants.DEFAULT_BUILD_IMAGE,
                false,
                ResourceUtils.getLabels(Constants.NAME, version, Map.of())
        );
    }

    public KaravanConfig(String version, String namespace, String environment, String runtimes, String auth, int nodePort, String gitPullInterval, int instances, String imageRegistry, String baseImage, String baseBuilderImage, boolean isOpenShift, Map<String, String> labels) {
        this.version = version;
        this.namespace = namespace;
        this.environment = environment;
        this.runtimes = runtimes;
        this.auth = auth;
        this.nodePort = nodePort;
        this.gitPullInterval = gitPullInterval;
        this.instances = instances;
        this.imageRegistry = imageRegistry;
        this.baseImage = baseImage;
        this.baseBuilderImage = baseBuilderImage;
        this.isOpenShift = isOpenShift;
        this.labels = labels;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public String getNamespace() {
        return namespace;
    }

    public void setNamespace(String namespace) {
        this.namespace = namespace;
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

    public String getGitPullInterval() {
        return gitPullInterval;
    }

    public void setGitPullInterval(String gitPullInterval) {
        this.gitPullInterval = gitPullInterval;
    }

    public int getInstances() {
        return instances;
    }

    public void setInstances(int instances) {
        this.instances = instances;
    }

    public String getImageRegistry() {
        return imageRegistry;
    }

    public void setImageRegistry(String imageRegistry) {
        this.imageRegistry = imageRegistry;
    }

    public String getBaseImage() {
        return baseImage;
    }

    public void setBaseImage(String baseImage) {
        this.baseImage = baseImage;
    }

    public String getBaseBuilderImage() {
        return baseBuilderImage;
    }

    public void setBaseBuilderImage(String baseBuilderImage) {
        this.baseBuilderImage = baseBuilderImage;
    }

    public boolean isOpenShift() {
        return isOpenShift;
    }

    public void setOpenShift(boolean openShift) {
        isOpenShift = openShift;
    }

    public Map<String, String> getLabels() {
        return labels;
    }

    public void setLabels(Map<String, String> labels) {
        this.labels = labels;
    }
}
