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
import java.util.*;
import java.util.stream.Collectors;

import static org.apache.camel.karavan.docker.DockerService.LABEL_PROJECT_ID;
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
//             if (Arrays.asList("create", "start", "unpause", "stop", "pause").contains(event.getStatus())) {
//                onExistingContainer(container);
//            } else {
                String status = event.getStatus();
                if (status.startsWith("health_status:")) {
                    if (container.getNames()[0].equals("/infinispan")) {
                        onInfinispanHealthEvent(container, event);
                    } else if (inDevMode(container)) {
                        onDevModeHealthEvent(container, event);
                    }
                }
//            }
        }
    }

    public void onDeletedContainer(Container container) {
        String name = container.getNames()[0].replace("/", "");
        infinispanService.deleteContainerStatus(name, environment, name);
        if (inDevMode(container)) {
            infinispanService.deleteCamelStatuses(name, environment);
        }
    }

    protected void onExistingContainer(Container container) {
        if (infinispanService.isReady()) {
            String name = container.getNames()[0].replace("/", "");
            List<Integer> ports = Arrays.stream(container.getPorts()).map(ContainerPort::getPrivatePort).filter(Objects::nonNull).collect(Collectors.toList());
            List<ContainerStatus.Command> commands = getContainerCommand(container.getState());
            ContainerStatus.ContainerType type = getContainerType(container.getLabels());
            String created = Instant.ofEpochSecond(container.getCreated()).toString();
            ContainerStatus ci = infinispanService.getContainerStatus(name, environment, name);
            if (ci == null) {
                ci = ContainerStatus.createWithId(name, environment, container.getId(), container.getImage(), ports, type, commands, container.getState(), created);
            } else {
                ci.setContainerId(container.getId());
                ci.setPorts(ports);
                ci.setType(type);
                ci.setCommands(commands);
                ci.setCreated(created);
                ci.setState(container.getState());
                ci.setImage(container.getImage());
            }
            infinispanService.saveContainerStatus(ci);
        }
    }

    public void onInfinispanHealthEvent(Container container, Event event) {
        String status = event.getStatus();
        String health = status.replace("health_status: ", "");
        LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
        eventBus.publish(INFINISPAN_STARTED, health);
    }

    public void onDevModeHealthEvent(Container container, Event event) {
        String status = event.getStatus();
        String health = status.replace("health_status: ", "");
        LOGGER.infof("Container %s health status: %s", container.getNames()[0], health);
        eventBus.publish(DEVMODE_CONTAINER_READY, container.getLabels().get(LABEL_PROJECT_ID));
    }

    private boolean inDevMode(Container container) {
        return Objects.equals(getContainerType(container.getLabels()), ContainerStatus.ContainerType.devmode);
    }

    private ContainerStatus.ContainerType getContainerType(Map<String, String> labels) {
        String type = labels.get(LABEL_TYPE);
        if (Objects.equals(type, ContainerStatus.ContainerType.devmode.name())) {
            return ContainerStatus.ContainerType.devmode;
        } else if (Objects.equals(type, ContainerStatus.ContainerType.devservice.name())) {
            return ContainerStatus.ContainerType.devservice;
        } else if (Objects.equals(type, ContainerStatus.ContainerType.project.name())) {
            return ContainerStatus.ContainerType.project;
        } else if (Objects.equals(type, ContainerStatus.ContainerType.internal.name())) {
            return ContainerStatus.ContainerType.internal;
        }
        return ContainerStatus.ContainerType.unknown;
    }

    private List<ContainerStatus.Command> getContainerCommand(String state) {
        List<ContainerStatus.Command> result = new ArrayList<>();
        if (Objects.equals(state, ContainerStatus.State.created.name())) {
            result.add(ContainerStatus.Command.run);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.exited.name())) {
            result.add(ContainerStatus.Command.run);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.running.name())) {
            result.add(ContainerStatus.Command.pause);
            result.add(ContainerStatus.Command.stop);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.paused.name())) {
            result.add(ContainerStatus.Command.run);
            result.add(ContainerStatus.Command.stop);
            result.add(ContainerStatus.Command.delete);
        } else if (Objects.equals(state, ContainerStatus.State.dead.name())) {
            result.add(ContainerStatus.Command.delete);
        }
        return result;
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
