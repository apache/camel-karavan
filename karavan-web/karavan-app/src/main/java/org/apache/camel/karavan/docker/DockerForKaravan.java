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
package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.model.HealthCheck;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.docker.model.DockerComposeService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;

import static org.apache.camel.karavan.shared.Constants.*;

@ApplicationScoped
public class DockerForKaravan {

    private static final Logger LOGGER = Logger.getLogger(DockerForKaravan.class.getName());

    @ConfigProperty(name = "karavan.devmode.image")
    String devmodeImage;

    @ConfigProperty(name = "karavan.infinispan.username")
    String infinispanUsername;
    @ConfigProperty(name = "karavan.infinispan.password")
    String infinispanPassword;

    @Inject
    DockerService dockerService;

    public void runProjectInDevMode(String projectId, String jBangOptions, Map<Integer, Integer> ports, Map<String, String> files) throws Exception {
        createDevmodeContainer(projectId, jBangOptions, ports);
        dockerService.runContainer(projectId);
        dockerService.copyFiles(projectId, "/code", files);
    }

    protected void createDevmodeContainer(String projectId, String jBangOptions, Map<Integer, Integer> ports) throws InterruptedException {
        LOGGER.infof("DevMode starting for %s with JBANG_OPTIONS=%s", projectId, jBangOptions);

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        List<String> env = jBangOptions != null && !jBangOptions.trim().isEmpty()
                ? List.of(ENV_VAR_JBANG_OPTIONS + "=" + jBangOptions)
                : List.of();

        dockerService.createContainer(projectId, devmodeImage,
                env, ports, healthCheck,
                Map.of(LABEL_TYPE, ContainerStatus.ContainerType.devmode.name(), LABEL_PROJECT_ID, projectId),
                Map.of());

        LOGGER.infof("DevMode started for %s", projectId);
    }

    public void runBuildProject(String projectId, String script, Map<String, String> files) throws Exception {
//        createBuildContainer(projectId, jBangOptions, ports);
//        dockerService.runContainer(projectId);
//        dockerService.copyFiles(projectId, "/code", files);


        //        String scriptName = "camel-main-builder-script-docker.sh";
//        String script = getResourceFile("/scripts/" + scriptName);
//        try {
//            CreateContainerResponse res = dockerClient.createContainerCmd("test")
//                    .withName("xxx")
//                    .withImage("ghcr.io/apache/camel-karavan-devmode:4.0.0-RC2")
//                    .withCmd("/karavan/"+scriptName)
//                    .withEnv("GIT_BRANCH=main",
//                            "GIT_REPOSITORY=http://gitea:3000/karavan/karavan.git",
//                            "GIT_USERNAME=karavan",
//                            "GIT_PASSWORD=karavan",
//                            "PROJECT_ID=zzzzz",
//                            "CAMEL_VERSION=4.0.0",
//                            "IMAGE_REGISTRY=registry:5000",
//                            "IMAGE_GROUP=karavan")
//                    .withHostConfig(new HostConfig().withNetworkMode("karavan")).exec();
//
//        } catch (Exception e) {
//            System.out.println(e.getMessage());
//        }
//
//        Container c = dockerClient.listContainersCmd().withShowAll(true).withNameFilter(Collections.singleton("xxx")).exec().get(0);
//
//        String temp = Vertx.vertx().fileSystem().createTempDirectoryBlocking("xxx");
//        String path = temp + File.separator + scriptName;
//        Vertx.vertx().fileSystem().writeFileBlocking(path, Buffer.buffer(script));
//
//        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
//                TarArchiveOutputStream tarArchive = new TarArchiveOutputStream(byteArrayOutputStream)) {
//            tarArchive.setLongFileMode(TarArchiveOutputStream.LONGFILE_POSIX);
//            tarArchive.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_POSIX);
//
//            TarArchiveEntry tarEntry = new TarArchiveEntry(new File(path));
//            tarEntry.setName(scriptName);
//            tarEntry.setMode(0700); //
//            tarArchive.putArchiveEntry(tarEntry);
//            IOUtils.write(Files.readAllBytes(Paths.get(path)), tarArchive);
//            tarArchive.closeArchiveEntry();
//            tarArchive.finish();
//
//            dockerClient.copyArchiveToContainerCmd(c.getId())
//                    .withTarInputStream(new ByteArrayInputStream(byteArrayOutputStream.toByteArray()))
//                    .withRemotePath("/karavan").exec();
//        } catch (Exception e) {
//            e.printStackTrace();
//        }

//        dockerClient.startContainerCmd(c.getId()).exec();
    }


    protected void createBuildContainer(String projectId, Map<Integer, Integer> ports) throws InterruptedException {
        LOGGER.infof("Starting Build Container for %s ", projectId);

        List<String> env = List.of(
                "GIT_REPOSITORY=http://gitea:3000/karavan/karavan.git",
                            "GIT_USERNAME=karavan",
                            "GIT_PASSWORD=karavan",
                            "PROJECT_ID=" + projectId,
                            "CAMEL_VERSION=4.0.0",
                            "IMAGE_REGISTRY=registry:5000",
                            "IMAGE_GROUP=karavan"
        );

//                    .withCmd("/karavan/"+scriptName)
//                    .withEnv("GIT_BRANCH=main",
//                            "GIT_REPOSITORY=http://gitea:3000/karavan/karavan.git",
//                            "GIT_USERNAME=karavan",
//                            "GIT_PASSWORD=karavan",
//                            "PROJECT_ID=zzzzz",
//                            "CAMEL_VERSION=4.0.0",
//                            "IMAGE_REGISTRY=registry:5000",
//                            "IMAGE_GROUP=karavan")
//                    .withHostConfig(new HostConfig().withNetworkMode("karavan")).exec();

        dockerService.createContainer(projectId + "-builder", devmodeImage,
                env, ports, new HealthCheck(),
                Map.of(LABEL_TYPE, ContainerStatus.ContainerType.devmode.name(), LABEL_PROJECT_ID, projectId),
                Map.of());

        LOGGER.infof("Build Container started for %s", projectId);
    }

    public void createDevserviceContainer(DockerComposeService dockerComposeService) throws InterruptedException {
        LOGGER.infof("DevService starting for ", dockerComposeService.getContainer_name());
        dockerService.createContainerFromCompose(dockerComposeService, ContainerStatus.ContainerType.devservice);
    }
}
