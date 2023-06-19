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
import java.util.Objects;

public class KaravanConfig {

    private String version;
    private String namespace;
    private String environment;
    private String runtimes;
    private String auth;
    private int nodePort;
    private int instances;
    private String baseImage;
    private String baseBuilderImage;
    private boolean isOpenShift;
    private Map<String,String> labels;

    private String masterPassword;
    private String oidcSecret;
    private String oidcServerUrl;
    private String oidcFrontendUrl;
    private String gitRepository;
    private String gitUsername;
    private String gitPassword;
    private String gitBranch;
    private String gitPullInterval;
    private String imageRegistry;
    private String imageGroup;
    private String imageRegistryUsername;
    private String imageRegistryPassword;

    public KaravanConfig(String version, String namespace, String environment, String runtimes, String auth,
                         int nodePort, int instances, String baseImage, String baseBuilderImage, boolean isOpenShift,
                         Map<String, String> labels, String masterPassword, String oidcSecret, String oidcServerUrl,
                         String oidcFrontendUrl, String gitRepository, String gitUsername, String gitPassword,
                         String gitBranch, String gitPullInterval, String imageRegistry, String imageGroup,
                         String imageRegistryUsername, String imageRegistryPassword) {
        this.version = version;
        this.namespace = namespace;
        this.environment = environment;
        this.runtimes = runtimes;
        this.auth = auth;
        this.nodePort = nodePort;
        this.instances = instances;
        this.baseImage = baseImage;
        this.baseBuilderImage = baseBuilderImage;
        this.isOpenShift = isOpenShift;
        this.labels = labels;
        this.masterPassword = masterPassword;
        this.oidcSecret = oidcSecret;
        this.oidcServerUrl = oidcServerUrl;
        this.oidcFrontendUrl = oidcFrontendUrl;
        this.gitRepository = gitRepository;
        this.gitUsername = gitUsername;
        this.gitPassword = gitPassword;
        this.gitBranch = gitBranch;
        this.gitPullInterval = gitPullInterval;
        this.imageRegistry = imageRegistry;
        this.imageGroup = imageGroup;
        this.imageRegistryUsername = imageRegistryUsername;
        this.imageRegistryPassword = imageRegistryPassword;
    }

    public boolean gitConfigured() {
        return gitRepository != null
                && gitUsername != null
                && gitPassword != null
                && gitBranch != null;
    }

    public boolean oidcConfigured() {
        return oidcSecret != null
                && oidcServerUrl != null
                && oidcFrontendUrl != null;
    }

    public boolean isAuthOidc() {
        return Objects.equals(this.auth, "oidc");
    }

    public boolean isAuthBasic() {
        return Objects.equals(this.auth, "basic");
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

    public String getMasterPassword() {
        return masterPassword;
    }

    public void setMasterPassword(String masterPassword) {
        this.masterPassword = masterPassword;
    }

    public String getOidcSecret() {
        return oidcSecret;
    }

    public void setOidcSecret(String oidcSecret) {
        this.oidcSecret = oidcSecret;
    }

    public String getOidcServerUrl() {
        return oidcServerUrl;
    }

    public void setOidcServerUrl(String oidcServerUrl) {
        this.oidcServerUrl = oidcServerUrl;
    }

    public String getOidcFrontendUrl() {
        return oidcFrontendUrl;
    }

    public void setOidcFrontendUrl(String oidcFrontendUrl) {
        this.oidcFrontendUrl = oidcFrontendUrl;
    }

    public String getGitRepository() {
        return gitRepository;
    }

    public void setGitRepository(String gitRepository) {
        this.gitRepository = gitRepository;
    }

    public String getGitUsername() {
        return gitUsername;
    }

    public void setGitUsername(String gitUsername) {
        this.gitUsername = gitUsername;
    }

    public String getGitPassword() {
        return gitPassword;
    }

    public void setGitPassword(String gitPassword) {
        this.gitPassword = gitPassword;
    }

    public String getGitBranch() {
        return gitBranch;
    }

    public void setGitBranch(String gitBranch) {
        this.gitBranch = gitBranch;
    }

    public String getImageRegistryUsername() {
        return imageRegistryUsername;
    }

    public void setImageRegistryUsername(String imageRegistryUsername) {
        this.imageRegistryUsername = imageRegistryUsername;
    }

    public String getImageRegistryPassword() {
        return imageRegistryPassword;
    }

    public void setImageRegistryPassword(String imageRegistryPassword) {
        this.imageRegistryPassword = imageRegistryPassword;
    }

    public String getImageGroup() {
        return imageGroup;
    }

    public void setImageGroup(String imageGroup) {
        this.imageGroup = imageGroup;
    }
}
