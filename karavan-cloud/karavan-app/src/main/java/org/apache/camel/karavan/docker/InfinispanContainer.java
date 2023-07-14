package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.model.HealthCheck;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class InfinispanContainer {

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

    private static final Logger LOGGER = Logger.getLogger(InfinispanContainer.class.getName());

    public static final String INFINISPAN_CONTAINER_NAME = "infinispan";

    public void startInfinispan() {
        try {
            LOGGER.info("Infinispan is starting...");

            HealthCheck healthCheck = new HealthCheck().withTest(List.of("CMD", "curl", "-f", "http://localhost:11222/rest/v2/cache-managers/default/health/status"))
                    .withInterval(10000000000L).withTimeout(10000000000L).withStartPeriod(10000000000L).withRetries(30);

            dockerService.createContainer(INFINISPAN_CONTAINER_NAME, infinispanImage,
                    List.of("USER=" + infinispanUsername, "PASS=" + infinispanPassword),
                    infinispanPort, true, healthCheck, Map.of()
            );
            dockerService.startContainer(INFINISPAN_CONTAINER_NAME);
            LOGGER.info("Infinispan is started");
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }
}