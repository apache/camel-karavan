package org.apache.camel.karavan.bashi;

import com.github.dockerjava.api.model.HealthCheck;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.bashi.docker.DockerService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.List;
import java.util.Map;

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

    @Inject
    DockerService dockerService;

    private static final Logger LOGGER = Logger.getLogger(ConductorService.class.getName());

    public static final String ADDRESS_INFINISPAN_START = "ADDRESS_INFINISPAN_START";
    public static final String ADDRESS_INFINISPAN_HEALTH = "ADDRESS_INFINISPAN_HEALTH";
    public static final String ADDRESS_RUNNER = "ADDRESS_RUNNER";

    @ConsumeEvent(value = ADDRESS_INFINISPAN_START, blocking = true, ordered = true)
    void startInfinispan(String data) throws InterruptedException {
        LOGGER.info("Infinispan is starting...");

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:11222/rest/v2/cache-managers/default/health/status"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        dockerService.createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword),
                infinispanPort, true, healthCheck, Map.of()
        );
        dockerService.startContainer(INFINISPAN_CONTAINER_NAME);
        LOGGER.info("Infinispan is started");
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

    @ConsumeEvent(value = ADDRESS_RUNNER, blocking = true, ordered = true)
    void manageRunner(JsonObject params) throws InterruptedException {
        String projectId = params.getString("projectId");
        String command = params.getString("command");
        String runnerName = projectId + "-" + RUNNER_SUFFIX;
        if (command.equals("run")) {
            LOGGER.infof("Runner starting for %s", projectId);
            dockerService.createContainer(runnerName, runnerImage,
                    List.of(), "", false, new HealthCheck(), Map.of("type", "runner")
            );
            dockerService.startContainer(runnerName);
            LOGGER.infof("Runner started for %s", projectId);
        } else {
            dockerService.stopContainer(runnerName);
            dockerService.deleteContainer(runnerName);
        }
    }
}
