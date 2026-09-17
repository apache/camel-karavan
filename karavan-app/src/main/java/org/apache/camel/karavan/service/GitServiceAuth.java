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
package org.apache.camel.karavan.service;

import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import io.smallrye.mutiny.tuples.Tuple2;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.kubernetes.KubernetesService;
import org.apache.camel.karavan.model.GitConfig;
import org.eclipse.jgit.api.TransportCommand;
import org.eclipse.jgit.transport.SshSessionFactory;
import org.eclipse.jgit.transport.SshTransport;
import org.eclipse.jgit.transport.UsernamePasswordCredentialsProvider;
import org.eclipse.jgit.transport.ssh.jsch.JschConfigSessionFactory;
import org.eclipse.jgit.transport.ssh.jsch.OpenSshConfig;
import org.eclipse.jgit.util.FS;
import org.jboss.logging.Logger;

import java.util.Optional;

@ApplicationScoped
public class GitServiceAuth {

    @Inject
    KubernetesService kubernetesService;

    private static final Logger LOGGER = Logger.getLogger(GitServiceAuth.class.getName());

    public GitConfig getGitConfig() {
        String repository;
        Optional<String> username;
        Optional<String> password;
        String branch;
        Optional<Integer> sshPort;
        Optional<String> privateKeyPath;
        Optional<String> knownHostsPath;
        boolean ephemeral = false;

        if (ConfigService.inDocker()) {
            repository = org.eclipse.microprofile.config.ConfigProvider.getConfig().getValue("karavan.git.repository", String.class);
            username = org.eclipse.microprofile.config.ConfigProvider.getConfig().getOptionalValue("karavan.git.username", String.class);
            password = org.eclipse.microprofile.config.ConfigProvider.getConfig().getOptionalValue("karavan.git.password", String.class);
            branch = org.eclipse.microprofile.config.ConfigProvider.getConfig().getValue("karavan.git.branch", String.class);
            sshPort = org.eclipse.microprofile.config.ConfigProvider.getConfig().getOptionalValue("karavan.git.ssh.port", Integer.class);
            privateKeyPath = org.eclipse.microprofile.config.ConfigProvider.getConfig().getOptionalValue("karavan.private-key-path", String.class);
            knownHostsPath = org.eclipse.microprofile.config.ConfigProvider.getConfig().getOptionalValue("karavan.known-hosts-path", String.class);
            ephemeral = org.eclipse.microprofile.config.ConfigProvider.getConfig().getOptionalValue("karavan.git.ephemeral", Boolean.class).orElse(false);
        } else {
            repository = kubernetesService.getKaravanSecret("karavan.git.repository");
            username = Optional.ofNullable(kubernetesService.getKaravanSecret("karavan.git.username"));
            password = Optional.ofNullable(kubernetesService.getKaravanSecret("karavan.git.password"));
            branch = kubernetesService.getKaravanSecret("karavan.git.branch");
            sshPort = Optional.ofNullable(kubernetesService.getKaravanSecret("karavan.git.ssh.port")).map(Integer::parseInt);
            privateKeyPath = Optional.ofNullable(kubernetesService.getKaravanSecret("karavan.private-key-path"));
            knownHostsPath = Optional.ofNullable(kubernetesService.getKaravanSecret("karavan.known-hosts-path"));
            var ephemeralValue = kubernetesService.getKaravanSecret("karavan.git.ephemeral");
            ephemeral = Boolean.parseBoolean(ephemeralValue);
        }
        
        if (ephemeral) {
            repository = "http://karavan.git";
            username = Optional.of("karavan");
            password = Optional.of("karavan");
            privateKeyPath = Optional.empty();
            knownHostsPath = Optional.empty();
            return new GitConfig(repository, username, password, branch, sshPort, privateKeyPath, knownHostsPath, ephemeral);
        } else {
            return new GitConfig(repository, username, password, branch, sshPort, privateKeyPath, knownHostsPath, ephemeral);
        }

    }

    public Tuple2<String,String> getSShFiles() {
        return Tuple2.of(getGitConfig().privateKeyPath().orElse(null), getGitConfig().knownHostsPath().orElse(null));
    }

    public <T extends TransportCommand> T setCredentials(T command) {
        var gitConfig = getGitConfig();
        if (gitConfig.privateKeyPath().isPresent() && (gitConfig.repository().startsWith("git") || gitConfig.repository().startsWith("ssh://"))) {
            LOGGER.info("Set SshTransport");
            command.setTransportConfigCallback(transport -> {
                SshTransport sshTransport = (SshTransport) transport;
                sshTransport.setSshSessionFactory(getSshSessionFactory());
            });
        } else if (gitConfig.username().isPresent() && gitConfig.password().isPresent()) {
            LOGGER.info("Set UsernamePasswordCredentialsProvider");
            command.setCredentialsProvider(new UsernamePasswordCredentialsProvider(gitConfig.username().get(), gitConfig.password().get()));
        }
        return command;
    }

    public SshSessionFactory getSshSessionFactory() {
        var gitConfig = getGitConfig();
        return new JschConfigSessionFactory() {
            protected void configureJSch(JSch jsch) {
                try {
                    jsch.addIdentity(gitConfig.privateKeyPath().get());
                    jsch.setKnownHosts(gitConfig.knownHostsPath().get());
                } catch (JSchException e) {
                    LOGGER.info("Error configureJSch: " + (e.getCause() != null ? e.getCause().getMessage() : e.getMessage()));
                }
            }

            @Override
            protected Session createSession(OpenSshConfig.Host hc, String user, String host, int port, FS fs) throws JSchException {
                if (gitConfig.sshPort().isPresent()) {
                    port = gitConfig.sshPort().get();
                }
                return super.createSession(hc, user, host, port, fs);
            }
        };
    }

    public boolean isEphemeral() {
        return getGitConfig().ephemeral();
    }
}