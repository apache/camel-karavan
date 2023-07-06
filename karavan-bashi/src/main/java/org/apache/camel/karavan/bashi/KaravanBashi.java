package org.apache.camel.karavan.bashi;

import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import org.apache.camel.karavan.bashi.docker.DockerService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.util.List;

import static org.apache.camel.karavan.bashi.KaravanConstants.INFINISPAN_CONTAINER_NAME;

@ApplicationScoped
public class KaravanBashi {

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
        dockerService.createNetwork();
        dockerService.startListeners();
        startInfinispan();
    }

    void startInfinispan() throws InterruptedException {
        LOGGER.info("Infinispan is starting...");
        dockerService.createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword), infinispanPort, false
        );
        dockerService.startContainer(INFINISPAN_CONTAINER_NAME);
        LOGGER.info("Infinispan is started");
    }

    void startKaravan() throws InterruptedException {
        LOGGER.info("Karavan is starting...");
        dockerService.createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword), infinispanPort, false
        );
        dockerService.startContainer(INFINISPAN_CONTAINER_NAME);
        LOGGER.info("Karavan is started");
    }

    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("Karavan Bashi is stopping...");
    }
}
