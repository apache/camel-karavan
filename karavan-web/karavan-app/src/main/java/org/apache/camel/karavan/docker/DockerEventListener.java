package org.apache.camel.karavan.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import io.vertx.core.eventbus.EventBus;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.ContainerStatus;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.io.Closeable;
import java.io.IOException;
import java.util.Objects;
import java.util.Optional;

import static org.apache.camel.karavan.shared.Constants.*;

@ApplicationScoped
public class DockerEventListener implements ResultCallback<Event> {

    @ConfigProperty(name = "karavan.image-registry")
    String registry;
    @ConfigProperty(name = "karavan.image-group")
    String group;
    @ConfigProperty(name = "karavan.image-registry-username")
    Optional<String> username;
    @ConfigProperty(name = "karavan.image-registry-password")
    Optional<String> password;

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
                if (container != null) {
                    onContainerEvent(event, container);
                }
            }
        } catch (Exception exception) {
            LOGGER.error(exception.getMessage());
        }
    }

    public void onContainerEvent(Event event, Container container) throws InterruptedException {
        if (infinispanService.isReady()) {
            if ("exited".equalsIgnoreCase(container.getState())
                    && Objects.equals(container.getLabels().get(LABEL_TYPE), ContainerStatus.ContainerType.build.name())) {
                String tag = container.getLabels().get(LABEL_TAG);
                String projectId = container.getLabels().get(LABEL_PROJECT_ID);
                String image = registry + "/" + group + "/" + projectId + ":" + tag;
                dockerService.pullImage(image);
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
        LOGGER.info("DockerEventListener close");
    }


}
