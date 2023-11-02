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

package org.apache.camel.karavan.installer;

import picocli.CommandLine;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.Callable;

@CommandLine.Command(name = "install",
        mixinStandardHelpOptions = true,
        description = "Karavan Installer")
public class KaravanCommand implements Callable<Integer> {

    @CommandLine.Option(names = {"-v", "--version"}, required = true, description = "Karavan version", defaultValue = "4.1.1")
    private String version;
    @CommandLine.Option(names = {"-n", "--namespace"}, description = "Namespace", defaultValue = Constants.DEFAULT_NAMESPACE)
    private String namespace;
    @CommandLine.Option(names = {"-e", "--environment"}, description = "Environment", defaultValue = Constants.DEFAULT_ENVIRONMENT)
    private String environment;
    @CommandLine.Option(names = {"--auth"}, description = "Authentication: public, basic, oidc", defaultValue = Constants.DEFAULT_AUTH)
    private String auth;
    @CommandLine.Option(names = {"--node-port"}, description = "Node port", defaultValue = "0")
    private int nodePort;
    @CommandLine.Option(names = {"--image"}, description = "Karavan Image", defaultValue = Constants.KARAVAN_IMAGE)
    private String baseImage;
    @CommandLine.Option(names = {"--devmode-image"}, description = "Karavan DevMode Image", defaultValue = Constants.DEFAULT_DEVMODE_IMAGE)
    private String devmodeImage;
    @CommandLine.Option(names = {"--file"}, description = "YAML file name", defaultValue = "karavan.yaml")
    private String file;
    @CommandLine.Option(names = {"--yaml"}, description = "Create YAML file. Do not apply")
    private boolean yaml;
    @CommandLine.Option(names = {"--openshift"}, description = "Create files for OpenShift")
    private boolean isOpenShift;

    @CommandLine.Option(names = {"--master-password"}, description = "Master password", defaultValue = "karavan")
    private String masterPassword;
    @CommandLine.Option(names = {"--oidc-secret"}, description = "OIDC secret")
    private String oidcSecret;
    @CommandLine.Option(names = {"--oidc-server-url"}, description = "OIDC server URL")
    private String oidcServerUrl;
    @CommandLine.Option(names = {"--oidc-frontend-url"}, description = "OIDC frontend URL")
    private String oidcFrontendUrl;
    @CommandLine.Option(names = {"--git-repository"}, description = "Git repository", defaultValue = Constants.DEFAULT_GIT_REPOSITORY)
    private String gitRepository;
    @CommandLine.Option(names = {"--git-username"}, description = "Git username", defaultValue = Constants.DEFAULT_GIT_USERNAME)
    private String gitUsername;
    @CommandLine.Option(names = {"--git-password"}, description = "Git password", defaultValue = Constants.DEFAULT_GIT_PASSWORD)
    private String gitPassword;
    @CommandLine.Option(names = {"--git-branch"}, description = "Git branch", defaultValue = Constants.DEFAULT_GIT_BRANCH)
    private String gitBranch;
    @CommandLine.Option(names = {"--image-registry"}, description = "Image registry")
    private String imageRegistry;
    @CommandLine.Option(names = {"--image-group"}, description = "Image group", defaultValue = "karavan")
    private String imageGroup;
    @CommandLine.Option(names = {"--image-registry-username"}, description = "Image registry username")
    private String imageRegistryUsername;
    @CommandLine.Option(names = {"--image-registry-password"}, description = "Image registry password")
    private String imageRegistryPassword;

    @CommandLine.Option(names = {"--infinispan-image"}, description = "Infinispan Image", defaultValue = Constants.INFINISPAN_IMAGE)
    private String infinispanImage;
    @CommandLine.Option(names = {"--infinispan-username"}, description = "Infinispan Username", defaultValue = Constants.INFINISPAN_USERNAME)
    private String infinispanUsername;
    @CommandLine.Option(names = {"--infinispan-password"}, description = "Infinispan Password", defaultValue = Constants.INFINISPAN_PASSWORD)
    private String infinispanPassword;

    @CommandLine.Option(names = {"--nexus-proxy"}, description = "Deploy nexus proxy")
    private boolean nexusProxy;

    @CommandLine.Option(names = {"--install-gitea"}, description = "Install Gitea (for demo purposes)", defaultValue = "false")
    private boolean installGitea;

    @CommandLine.Option(names = {"--install-infinispan"}, description = "Install Infinispan", defaultValue = "true")
    private boolean installInfinispan;

    @CommandLine.Option(names = {"-h", "--help"}, usageHelp = true, description = "Display help")
    private boolean helpRequested;

    private Map<String, String> labels = new HashMap<>();

    public static void main(String... args) {
        CommandLine commandLine = new CommandLine(new KaravanCommand());
        commandLine.parseArgs(args);
        if (commandLine.isUsageHelpRequested()) {
            commandLine.usage(System.out);
            System.exit(0);
        }
        int exitCode = commandLine.execute(args);
        System.exit(exitCode);
    }

    @Override
    public Integer call() throws Exception {
        if (yaml) {
            System.out.println("⭕  Preparing Karavan resources YAML");
            Files.writeString(Path.of(file), ResourceUtils.generateResources(this));
            System.out.println("\uD83D\uDC4D Prepared Karavan resources YAML " + file);
        } else {
            CommandUtils.installKaravan(this);
        }
        return 0;
    }

    public boolean gitConfigured() {
        return
                installGitea
                        || (gitRepository != null
                        && !Constants.DEFAULT_GIT_PASSWORD.equals(gitPassword)
                        && gitUsername !=null
                        && gitBranch !=null
                );
    }

    public boolean oidcConfigured() {
        return oidcSecret != null
                && oidcServerUrl != null
                && oidcFrontendUrl != null;
    }

    public boolean isInstallGitea() {
        return installGitea;
    }

    public boolean isInstallInfinispan() {
        return installInfinispan;
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

    public String getBaseImage() {
        return baseImage;
    }

    public void setBaseImage(String baseImage) {
        this.baseImage = baseImage;
    }

    public String getDevmodeImage() {
        return devmodeImage;
    }

    public void setDevmodeImage(String devmodeImage) {
        this.devmodeImage = devmodeImage;
    }

    public String getFile() {
        return file;
    }

    public void setFile(String file) {
        this.file = file;
    }

    public boolean isYaml() {
        return yaml;
    }

    public void setYaml(boolean yaml) {
        this.yaml = yaml;
    }

    public boolean isOpenShift() {
        return isOpenShift;
    }

    public void setOpenShift(boolean openShift) {
        isOpenShift = openShift;
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

    public String getImageRegistry() {
        return imageRegistry;
    }

    public void setImageRegistry(String imageRegistry) {
        this.imageRegistry = imageRegistry;
    }

    public String getImageGroup() {
        return imageGroup;
    }

    public void setImageGroup(String imageGroup) {
        this.imageGroup = imageGroup;
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

    public String getInfinispanImage() {
        return infinispanImage;
    }

    public void setInfinispanImage(String infinispanImage) {
        this.infinispanImage = infinispanImage;
    }

    public String getInfinispanUsername() {
        return infinispanUsername;
    }

    public void setInfinispanUsername(String infinispanUsername) {
        this.infinispanUsername = infinispanUsername;
    }

    public String getInfinispanPassword() {
        return infinispanPassword;
    }

    public void setInfinispanPassword(String infinispanPassword) {
        this.infinispanPassword = infinispanPassword;
    }

    public boolean isNexusProxy() {
        return nexusProxy;
    }

    public void setNexusProxy(boolean nexusProxy) {
        this.nexusProxy = nexusProxy;
    }

    public boolean isHelpRequested() {
        return helpRequested;
    }

    public void setHelpRequested(boolean helpRequested) {
        this.helpRequested = helpRequested;
    }

    public Map<String, String> getLabels() {
        return labels;
    }

    public void setLabels(Map<String, String> labels) {
        this.labels = labels;
    }
}
