package org.apache.camel.karavan.bashi;

import io.quarkus.runtime.ShutdownEvent;
import io.quarkus.runtime.StartupEvent;
import io.vertx.core.eventbus.EventBus;
import org.apache.camel.karavan.bashi.docker.DockerService;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;

@ApplicationScoped
public class KaravanBashi {

    @Inject
    EventBus eventBus;

    @Inject
    DockerService dockerService;

    private static final Logger LOGGER = Logger.getLogger(KaravanBashi.class.getName());

    void onStart(@Observes StartupEvent ev) throws InterruptedException {
        LOGGER.info("Karavan Bashi is starting...");
        dockerService.createNetwork();
        dockerService.checkDataGridHealth();
        dockerService.startListeners();
        eventBus.publish(ConductorService.ADDRESS_INFINISPAN_START, "");
    }

    void onStop(@Observes ShutdownEvent ev) {
        LOGGER.info("Karavan Bashi is stopping...");
    }
}
