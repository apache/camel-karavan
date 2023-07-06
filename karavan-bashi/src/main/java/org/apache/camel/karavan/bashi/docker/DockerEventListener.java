package org.apache.camel.karavan.bashi.docker;

import com.github.dockerjava.api.async.ResultCallback;
import com.github.dockerjava.api.model.Event;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import java.io.Closeable;
import java.io.IOException;

@ApplicationScoped
public class DockerEventListener implements ResultCallback<Event> {

    private static final Logger LOGGER = Logger.getLogger(DockerEventListener.class.getName());

    @Override
    public void onStart(Closeable closeable) {
        LOGGER.info("DockerEventListener started");
    }

    @Override
    public void onNext(Event event) {
        LOGGER.info(event.getType() + " : " + event.getStatus());
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
