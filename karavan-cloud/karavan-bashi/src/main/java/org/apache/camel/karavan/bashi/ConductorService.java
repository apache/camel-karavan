package org.apache.camel.karavan.bashi;

import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.HealthCheck;
import com.github.dockerjava.api.model.Statistics;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.bashi.docker.DockerService;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.*;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.apache.camel.karavan.bashi.Constants.*;

@ApplicationScoped
public class ConductorService {

    @ConfigProperty(name = "karavan.image")
    String karavanImage;
    @ConfigProperty(name = "karavan.port")
    String karavanPort;
    @ConfigProperty(name = "karavan.git-repository")
    String gitRepository;
    @ConfigProperty(name = "karavan.git-username")
    String gitUsername;
    @ConfigProperty(name = "karavan.git-password")
    String gitPassword;
    @ConfigProperty(name = "karavan.git-branch")
    String gitBranch;
    @ConfigProperty(name = "karavan.runner-image")
    String runnerImage;

    @ConfigProperty(name = "infinispan.image")
    String infinispanImage;
    @ConfigProperty(name = "infinispan.port")
    String infinispanPort;
    @ConfigProperty(name = "infinispan.username")
    String infinispanUsername;
    @ConfigProperty(name = "infinispan.password")
    String infinispanPassword;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    DatagridService datagridService;

    private static final Logger LOGGER = Logger.getLogger(ConductorService.class.getName());

    public static final String ADDRESS_INFINISPAN_START = "ADDRESS_INFINISPAN_START";
    public static final String ADDRESS_INFINISPAN_HEALTH = "ADDRESS_DATAGRID_HEALTH";
    public static final String ADDRESS_CONTAINER_STATS = "ADDRESS_CONTAINER_STATS";

    @ConsumeEvent(value = ADDRESS_INFINISPAN_START, blocking = true, ordered = true)
    void startInfinispan(String data) throws InterruptedException {
        LOGGER.info("Infinispan is starting...");

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:11222/rest/v2/cache-managers/default/health/status"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        dockerService.createContainer(DATAGRID_CONTAINER_NAME, infinispanImage,
                List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword),
                infinispanPort, true, healthCheck, Map.of()
        );
        dockerService.startContainer(DATAGRID_CONTAINER_NAME);
        LOGGER.info("Infinispan is started");
    }

    @ConsumeEvent(value = ADDRESS_INFINISPAN_HEALTH, blocking = true, ordered = true)
    void startServices(String infinispanHealth){
        if (infinispanHealth.equals("healthy")) {
            datagridService.start();
        }
    }

    @ConsumeEvent(value = ADDRESS_INFINISPAN_HEALTH, blocking = true, ordered = true)
    void startKaravan(String infinispanHealth) throws InterruptedException {
        if (infinispanHealth.equals("healthy")) {
            LOGGER.info("Karavan is starting...");
            dockerService.createContainer(KARAVAN_CONTAINER_NAME, karavanImage,
                    List.of(
                            "QUARKUS_INFINISPAN_CLIENT_HOSTS=infinispan:11222",
                            "KARAVAN_GIT_REPOSITORY=" + gitRepository,
                            "KARAVAN_GIT_USERNAME=" + gitUsername,
                            "KARAVAN_GIT_PASSWORD=" + gitPassword,
                            "KARAVAN_GIT_BRANCH=" + gitBranch
                    ),
                    karavanPort, true, new HealthCheck(), Map.of()
            );
            dockerService.startContainer(KARAVAN_CONTAINER_NAME);
            LOGGER.info("Karavan is started");
        }
    }

    @ConsumeEvent(value = ADDRESS_CONTAINER_STATS, blocking = true, ordered = true)
    public void saveStats(JsonObject data) {
        String projectId = data.getString("projectId");
        String memory = data.getString("memory");
        String cpu = data.getString("cpu");
        if (datagridService.isReady()) {
            PodStatus podStatus = datagridService.getDevModePodStatuses(projectId, environment);
            if (podStatus != null) {
                podStatus.setCpuInfo(cpu);
                podStatus.setMemoryInfo(memory);
                datagridService.savePodStatus(podStatus);
            }
        }
    }

    @ConsumeEvent(value = DatagridService.ADDRESS_DEVMODE_COMMAND, blocking = true, ordered = true)
    void receiveCommand(JsonObject message) throws InterruptedException {
        LOGGER.info("DevMode Command: " + message);
        DevModeCommand command = message.mapTo(DevModeCommand.class);
        switch (command.getCommandName()){
            case RUN:
                runContainer(command);
                break;
            case DELETE:
                deleteContainer(command);
                break;
            case LOG:
                logContainer(command);
                break;
        }
        datagridService.deleteDevModeCommand(command);
    }

    void runContainer(DevModeCommand command) throws InterruptedException {
        if (DevModeCommandType.DEVMODE.equals(command.getType())) {
            String projectId = command.getProjectId();
            LOGGER.infof("DevMode starting for %s", projectId);
            HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:8080/q/dev/health"))
                    .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);
            dockerService.createContainer(command.getContainerName(), runnerImage,
                    List.of(), "", false, healthCheck,
                    Map.of("type", "devmode", "projectId", projectId));
            dockerService.startContainer(command.getContainerName());
            LOGGER.infof("DevMode started for %s", projectId);
        } else {

        }
    }

    void deleteContainer(DevModeCommand command) {
        if (DevModeCommandType.DEVMODE.equals(command.getType())) {
            datagridService.deleteDevModeStatus(command.getProjectId());
            dockerService.stopContainer(command.getContainerName());
            dockerService.deleteContainer(command.getContainerName());
        } else {
            dockerService.stopContainer(command.getContainerName());
            dockerService.deleteContainer(command.getContainerName());
        }
    }

    void logContainer(DevModeCommand command) {
        dockerService.logContainer(command.getContainerName());
    }
}