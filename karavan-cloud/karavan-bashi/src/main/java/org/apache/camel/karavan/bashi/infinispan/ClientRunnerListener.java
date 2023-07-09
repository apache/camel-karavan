package org.apache.camel.karavan.bashi.infinispan;

import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.bashi.ConductorService;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryCreated;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryModified;
import org.infinispan.client.hotrod.annotation.ClientListener;
import org.infinispan.client.hotrod.event.ClientCacheEntryCreatedEvent;
import org.infinispan.client.hotrod.event.ClientCacheEntryModifiedEvent;

import java.util.Objects;

@ClientListener
public class ClientRunnerListener {

    private final InfinispanService infinispanService;
    private final EventBus eventBus;

    public ClientRunnerListener(InfinispanService infinispanService, EventBus eventBus) {
        this.infinispanService = infinispanService;
        this.eventBus = eventBus;
    }

    @ClientCacheEntryCreated
    public void entryCreated(ClientCacheEntryCreatedEvent<GroupedKey> event) {
        System.out.println("entryCreated");
        String command = event.getKey().getKey();
        String projectId = event.getKey().getGroup();
        if (Objects.equals(command, RunnerCommand.NAME.run.name())) {
            eventBus.publish(ConductorService.ADDRESS_RUNNER, JsonObject.of("projectId", projectId, "command", command, "isRunner", true));
        } else if (Objects.equals(command, RunnerCommand.NAME.delete.name())) {
            eventBus.publish(ConductorService.ADDRESS_RUNNER, JsonObject.of("projectId", projectId, "command", command, "isRunner", true));
        }
    }

    @ClientCacheEntryModified
    public void entryModified(ClientCacheEntryModifiedEvent<GroupedKey> event) {
        System.out.println("entryCreated");
        String command = event.getKey().getKey();
        String projectId = event.getKey().getGroup();
        if (Objects.equals(command, RunnerCommand.NAME.run.name())) {
            eventBus.publish(ConductorService.ADDRESS_RUNNER, JsonObject.of("projectId", projectId, "command", command, "isRunner", true));
        } else if (Objects.equals(command, RunnerCommand.NAME.delete.name())) {
            eventBus.publish(ConductorService.ADDRESS_RUNNER, JsonObject.of("projectId", projectId, "command", command, "isRunner", true));
        }
    }

}