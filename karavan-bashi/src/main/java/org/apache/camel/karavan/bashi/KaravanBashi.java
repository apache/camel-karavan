package org.apache.camel.karavan.bashi;

import com.github.dockerjava.api.model.HealthCheck;
import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.vertx.ConsumeEvent;
import org.apache.camel.karavan.bashi.docker.DockerService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.util.List;

import static org.apache.camel.karavan.bashi.KaravanConstants.*;

@ApplicationScoped
public class KaravanBashi {

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

    private static final Logger LOGGER = Logger.getLogger(KaravanBashi.class.getName());

    void onStart(@Observes StartupEvent ev) throws InterruptedException {
        LOGGER.info("Karavan Bashi is starting...");
        dockerService.checkContainersStatus();
        dockerService.createNetwork();
        dockerService.startListeners();
        startInfinispan();
    }

    void startInfinispan() throws InterruptedException {
        LOGGER.info("Infinispan is starting...");

        HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:11222/rest/v2/cache-managers/default/health/status"))
                .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

        dockerService.createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword),
                infinispanPort, true, healthCheck
        );
        dockerService.startContainer(INFINISPAN_CONTAINER_NAME);
        LOGGER.info("Infinispan is started");
    }

    @ConsumeEvent(value = ADDRESS_INFINISPAN_HEALTH, blocking = true, ordered = false)
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
                    karavanPort, true, new HealthCheck()
            );
            dockerService.startContainer(KARAVAN_CONTAINER_NAME);
            LOGGER.info("Karavan is started");
        }
    }

    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("Karavan Bashi is stopping...");
    }
}
