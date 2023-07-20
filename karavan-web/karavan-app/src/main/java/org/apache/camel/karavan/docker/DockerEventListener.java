package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.ContainerPort;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerInfo;
import org.apache.camel.karavan.infinispan.model.DevModeStatus;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.Closeable;
import java.io.IOException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.docker.DockerService.LABEL_TYPE;
import static org.apache.camel.karavan.shared.EventType.DEVMODE_STATUS;
import static org.apache.camel.karavan.shared.EventType.INFINISPAN_STARTED;
import static org.apache.camel.karavan.shared.ConfigService.DEVMODE_SUFFIX;

@ApplicationScoped
public class DockerEventListener implements ResultCallback<Event> {

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @Inject
    DockerService dockerService;

    @Inject
    EventBus eventBus;

    @Inject
    InfinispanService infinispanService;

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
                } else if (Objects.equals(container.getLabels().get(LABEL_TYPE), ContainerStatus.CType.devmode.name())) {
                    onDevModeEvent(event, container);
                }
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
        }
    }

    public void onContainerEvent(Event event, Container container) {
        if (infinispanService.isReady()) {
            String name = container.getNames()[0].replace("/", "");
            if (Arrays.asList("destroy", "stop", "die", "kill", "pause", "destroy", "rename").contains(event.getStatus())) {
                infinispanService.deleteContainerInfo(name);
            } else if (Arrays.asList("create", "start", "unpause").contains(event.getStatus())) {
                List<Integer> ports = Arrays.stream(container.getPorts()).map(ContainerPort::getPrivatePort).filter(Objects::nonNull).collect(Collectors.toList());
                ContainerInfo ci = new ContainerInfo(name, container.getId(), container.getImage(), ports, environment);
                infinispanService.saveContainerInfo(ci);
            }
        }
    }

    public void onInfinispanHealthEvent(Event event, Container container) {
        String status = event.getStatus();
        String health = status.replace("health_status: ", "");
        LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
        eventBus.publish(INFINISPAN_STARTED, health);
    }

    public void onDevModeEvent(Event event, Container container) {
        try {
            if (infinispanService.isReady()) {
                String status = event.getStatus();
                String name = container.getNames()[0].replace("/", "");
                if (Arrays.asList("stop", "die", "kill", "pause", "destroy").contains(event.getStatus())) {
                    String projectId = name.replace(DEVMODE_SUFFIX, "");
                    infinispanService.deleteContainerStatus(projectId, environment, name);
                    infinispanService.deleteCamelStatuses(projectId, environment);
                } else if (Arrays.asList("start", "unpause").contains(event.getStatus())) {
                    saveContainerStatus(container);
                } else if (status.startsWith("health_status:")) {
                    String health = status.replace("health_status: ", "");
                    LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
                    //update DevModeStatus
                    String containerName = container.getNames()[0].replace("/", "");
                    DevModeStatus dms = infinispanService.getDevModeStatus(container.getLabels().get("projectId"));
                    if (dms != null) {
                        dms.setContainerName(containerName);
                        dms.setContainerId(container.getId());
                        infinispanService.saveDevModeStatus(dms);
                        eventBus.publish(DEVMODE_STATUS, JsonObject.mapFrom(dms));
                    }
                }
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
        }
    }

    protected void saveContainerStatus(Container container){
        String name = container.getNames()[0].replace("/", "");
        String projectId = name.replace(DEVMODE_SUFFIX, "");
        Integer exposedPort =  (container.getPorts().length > 0)  ? container.getPorts()[0].getPublicPort() : null;
        if (infinispanService.isReady()) {
            ContainerStatus ps = infinispanService.getDevModeContainerStatuses(projectId, environment);
            if (ps == null) {
                ps = new ContainerStatus(name, true, projectId, environment, getCtype(container.getLabels()), Instant.ofEpochSecond(container.getCreated()).toString(), exposedPort);
            } else {
                ps.setExposedPort(exposedPort);
            }
            infinispanService.saveContainerStatus(ps);
        }
    }

    private ContainerStatus.CType getCtype(Map<String, String> labels) {
        String type = labels.get(LABEL_TYPE);
        if (Objects.equals(type, ContainerStatus.CType.devmode.name())) {
            return ContainerStatus.CType.devmode;
        } else if (Objects.equals(type, ContainerStatus.CType.devservice.name())) {
            return ContainerStatus.CType.devservice;
        }
        return ContainerStatus.CType.container;
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
