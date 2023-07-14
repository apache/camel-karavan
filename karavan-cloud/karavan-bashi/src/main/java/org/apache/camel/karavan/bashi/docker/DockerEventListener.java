package org.apache.camel.karavan.bashi.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.ContainerPort;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import io.vertx.core.eventbus.EventBus;
import org.apache.camel.karavan.bashi.ConductorService;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.ContainerInfo;
import org.apache.camel.karavan.datagrid.model.DevModeStatus;
import org.apache.camel.karavan.datagrid.model.PodStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.Closeable;
import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.datagrid.model.DevModeCommand.DEVMODE_SUFFIX;

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
        try {
            if (Objects.equals(event.getType(), EventType.CONTAINER)) {
                Container container = dockerService.getContainer(event.getId());
                onContainerEvent(event, container);
                String status = event.getStatus();
                if (container.getNames()[0].equals("/infinispan") && status.startsWith("health_status:")) {
                    onInfinispanHealthEvent(event, container);
                } else if (container.getNames()[0].endsWith(DEVMODE_SUFFIX) || Objects.equals(container.getLabels().get("type"), "devmode")) {
                    onDevModeEvent(event, container);
                }
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
        }
    }

    public void onContainerEvent(Event event, Container container) {
        if (datagridService.isReady()) {
            String name = container.getNames()[0].replace("/", "");
            if (Arrays.asList("destroy", "stop", "die", "kill", "pause", "destroy", "rename").contains(event.getStatus())) {
                datagridService.deleteContainerInfo(name);
            } else if (Arrays.asList("create", "start", "unpause").contains(event.getStatus())) {
                List<Integer> ports = Arrays.stream(container.getPorts()).map(ContainerPort::getPrivatePort).filter(Objects::nonNull).collect(Collectors.toList());
                ContainerInfo ci = new ContainerInfo(name, container.getId(), container.getImage(), ports, environment);
                datagridService.saveContainerInfo(ci);
            }
        }
    }

    public void onInfinispanHealthEvent(Event event, Container container) {
        String status = event.getStatus();
        String health = status.replace("health_status: ", "");
        LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
        eventBus.publish(ConductorService.ADDRESS_INFINISPAN_HEALTH, health);
    }

    public void onDevModeEvent(Event event, Container container) {
        try {
            if (datagridService.isReady()) {
                String status = event.getStatus();
                String name = container.getNames()[0].replace("/", "");
                if (Arrays.asList("stop", "die", "kill", "pause", "destroy").contains(event.getStatus())) {
                    String projectId = name.replace(DEVMODE_SUFFIX, "");
                    datagridService.deletePodStatus(projectId, environment, name);
                    datagridService.deleteCamelStatuses(projectId, environment);
                } else if (Arrays.asList("start", "unpause").contains(event.getStatus())) {
                    String projectId = name.replace(DEVMODE_SUFFIX, "");
                    PodStatus ps = new PodStatus(name, true, null, projectId, environment, true, Instant.ofEpochSecond(container.getCreated()).toString());
                    datagridService.savePodStatus(ps);
                } else if (status.startsWith("health_status:")) {
                    String health = status.replace("health_status: ", "");
                    LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
                    //update DevModeStatus
                    String containerName = container.getNames()[0].replace("/", "");
                    DevModeStatus dms = datagridService.getDevModeStatus(container.getLabels().get("projectId"));
                    if (dms != null) {
                        dms.setContainerName(containerName);
                        dms.setContainerId(container.getId());
                        datagridService.saveDevModeStatus(dms);
                    }
                }
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
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
