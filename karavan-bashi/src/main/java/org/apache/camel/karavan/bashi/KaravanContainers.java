package org.apache.camel.karavan.bashi;

import com.github.dockerjava.api.model.Container;
import io.vertx.core.eventbus.EventBus;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.concurrent.ConcurrentHashMap;

import static org.apache.camel.karavan.bashi.KaravanConstants.ADDRESS_INFINISPAN_HEALTH;

@ApplicationScoped
public class KaravanContainers {

    private static final Logger LOGGER = Logger.getLogger(KaravanContainers.class.getName());

    private static final ConcurrentHashMap<String, String> containers = new ConcurrentHashMap<>();

    @Inject
    EventBus eventBus;

    public void addContainer(Container container, String health){
        containers.put(container.getId(), health);
        if (container.getNames()[0].equals("/infinispan")) {
            eventBus.publish(ADDRESS_INFINISPAN_HEALTH, health);
        }
    }

    public void removeContainer(String id){
        containers.remove(id);
    }
}
