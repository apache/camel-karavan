package org.apache.camel.karavan.bashi.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import io.vertx.core.eventbus.EventBus;
import org.apache.camel.karavan.bashi.ConductorService;
import org.apache.camel.karavan.bashi.Constants;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.Closeable;
import java.io.IOException;
import java.util.Arrays;
import java.util.Objects;

@ApplicationScoped
public class DockerEventListener implements ResultCallback<Event> {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @Inject
    DatagridService datagridService;

    private static final Logger LOGGER = Logger.getLogger(DockerEventListener.class.getName());

    @Override
    public void onStart(Closeable closeable) {
        LOGGER.info("DockerEventListener started");
    }

    @Override
    public void onNext(Event event) {
//        LOGGER.info(event.getType() + " : " + event.getStatus());
        if (Objects.equals(event.getType(), EventType.CONTAINER)) {
            Container container = dockerService.getContainer(event.getId());
            String status = event.getStatus();
            if (container.getNames()[0].equals("/infinispan") && status.startsWith("health_status:")) {
                String health = status.replace("health_status: ", "");
                LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
                eventBus.publish(ConductorService.ADDRESS_INFINISPAN_HEALTH, health);
            } else if (container.getNames()[0].endsWith(Constants.DEVMODE_SUFFIX)) {
                if (Arrays.asList("stop", "die", "kill", "pause", "destroy").contains(event.getStatus())) {
                    String name = container.getNames()[0].replace("/", "");
                    String projectId = name.replace("-" + Constants.DEVMODE_SUFFIX, "");
                    datagridService.deletePodStatus(projectId, environment, name);
                } else if (Arrays.asList("start", "unpause").contains(event.getStatus())) {

                }
            }
        }
    }

    @Override
    public void onError(Throwable throwable) {
        LOGGER.error(throwable.getMessage());
    }

    @Override
    public void onComplete() {
        LOGGER.error("DockerEventListener complete");
    }

    @Override
    public void close() throws IOException {
        LOGGER.error("DockerEventListener close");
    }


}
