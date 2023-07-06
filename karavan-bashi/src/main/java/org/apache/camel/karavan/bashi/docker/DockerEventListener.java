package org.apache.camel.karavan.bashi.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Container;
import com.github.dockerjava.api.model.Event;
import com.github.dockerjava.api.model.EventType;
import org.apache.camel.karavan.bashi.HealthChecker;
import org.apache.camel.karavan.bashi.KaravanContainers;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.Closeable;
import java.io.IOException;
import java.util.Arrays;
import java.util.Objects;

@ApplicationScoped
public class DockerEventListener implements ResultCallback<Event> {

    @Inject
    KaravanContainers karavanContainers;

    @Inject
    DockerService dockerService;

    private static final Logger LOGGER = Logger.getLogger(DockerEventListener.class.getName());

    @Override
    public void onStart(Closeable closeable) {
        LOGGER.info("DockerEventListener started");
    }

    @Override
    public void onNext(Event event) {
//        LOGGER.info(event.getType() + " : " + event.getStatus());
        if (Objects.equals(event.getType(), EventType.CONTAINER)){
            Container c = dockerService.getContainer(event.getId());
            if (Arrays.asList("stop", "die", "kill", "pause", "destroy").contains(event.getStatus())) {
                karavanContainers.removeContainer(c.getId());
            } else if (Arrays.asList("start", "unpause").contains(event.getStatus())) {
                karavanContainers.addContainer(c, "unknown");
            } else if (event.getStatus().startsWith("health_status:")) {
                String health = event.getStatus().replace("health_status: ", "");
                LOGGER.info(event.getType() + " : " + event.getId() + " : " + health);
                karavanContainers.addContainer(c, health);
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
