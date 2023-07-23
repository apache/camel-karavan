package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.ContainerPort;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.infinispan.InfinispanService;
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
import static org.apache.camel.karavan.shared.EventType.DEVMODE_CONTAINER_READY;
import static org.apache.camel.karavan.shared.EventType.INFINISPAN_STARTED;

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
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
        }
    }

    public void onContainerEvent(Event event, Container container) {
        if (infinispanService.isReady()) {
            if (Arrays.asList("destroy", "stop", "die", "kill", "pause", "destroy", "rename").contains(event.getStatus())) {
                onDeleteContainer(container);
            } else if (Arrays.asList("create", "start", "unpause").contains(event.getStatus())) {
                onCreateContainer(container, event);
            } else {
                String status = event.getStatus();
                if (status.startsWith("health_status:")) {
                    if (container.getNames()[0].equals("/infinispan")) {
                        onInfinispanHealthEvent(container, event);
                    } else if (inDevMode(container)) {
                        onDevModeHealthEvent(container,event);
                    }
                }
            }
        }
    }

    private void onDeleteContainer(Container container){
        String name = container.getNames()[0].replace("/", "");
        infinispanService.deleteContainerStatus(name, environment, name);
        if (inDevMode(container)) {
            infinispanService.deleteCamelStatuses(name, environment);
        }
    }

    protected void onCreateContainer(Container container, Event event){
        String name = container.getNames()[0].replace("/", "");
        List<Integer> ports = Arrays.stream(container.getPorts()).map(ContainerPort::getPrivatePort).filter(Objects::nonNull).collect(Collectors.toList());
        ContainerStatus.Lifecycle lc = event.getStatus().equals("create") ? ContainerStatus.Lifecycle.init : ContainerStatus.Lifecycle.ready;
        ContainerStatus.CType type = getCtype(container.getLabels());
        String created = Instant.ofEpochSecond(container.getCreated()).toString();
        ContainerStatus ci = infinispanService.getContainerStatus(name, environment, name);
        if (ci == null) {
            ci = ContainerStatus.createWithId(name, environment, container.getId(), ports, type, lc, created);
        } else {
            ci.setContainerId(container.getId());
            ci.setPorts(ports);
            ci.setType(type);
            ci.setLifeCycle(lc);
            ci.setCreated(created);
        }
        infinispanService.saveContainerStatus(ci);
    }

    public void onInfinispanHealthEvent(Container container, Event event) {
        String status = event.getStatus();
        String health = status.replace("health_status: ", "");
        LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
        eventBus.publish(INFINISPAN_STARTED, health);
    }

    public void onDevModeHealthEvent(Container container, Event event) {
        String name = container.getNames()[0].replace("/", "");
        String status = event.getStatus();
        String health = status.replace("health_status: ", "");
        LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
        // update ContainerStatus: set ready and
        ContainerStatus cs = infinispanService.getDevModeContainerStatus(name, environment);
        if (cs != null) {
            cs.setLifeCycle(ContainerStatus.Lifecycle.ready);
            cs.setContainerId(container.getId());
            infinispanService.saveContainerStatus(cs);
            eventBus.publish(DEVMODE_CONTAINER_READY, JsonObject.mapFrom(cs));
        }
    }

    private boolean inDevMode(Container container) {
        return Objects.equals(getCtype(container.getLabels()), ContainerStatus.CType.devmode);
    }

    private ContainerStatus.CType getCtype(Map<String, String> labels) {
        String type = labels.get(LABEL_TYPE);
        if (Objects.equals(type, ContainerStatus.CType.devmode.name())) {
            return ContainerStatus.CType.devmode;
        } else if (Objects.equals(type, ContainerStatus.CType.devservice.name())) {
            return ContainerStatus.CType.devservice;
        } else if (Objects.equals(type, ContainerStatus.CType.project.name())) {
            return ContainerStatus.CType.project;
        } else if (Objects.equals(type, ContainerStatus.CType.internal.name())) {
            return ContainerStatus.CType.internal;
        }
        return ContainerStatus.CType.unknown;
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
        LOGGER.info("DockerEventListener close");
    }


}
