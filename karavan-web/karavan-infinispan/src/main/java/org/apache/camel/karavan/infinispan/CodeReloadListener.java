package org.apache.camel.karavan.infinispan;

import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.infinispan.model.GroupedKey;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryCreated;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryModified;
import org.infinispan.client.hotrod.annotation.ClientListener;
import org.infinispan.client.hotrod.event.ClientCacheEntryCreatedEvent;
import org.infinispan.client.hotrod.event.ClientCacheEntryModifiedEvent;

@ClientListener
public class CodeReloadListener {
    private final EventBus eventBus;

    public CodeReloadListener(EventBus eventBus) {
        this.eventBus = eventBus;
    }

    @ClientCacheEntryCreated
    public void entryCreated(ClientCacheEntryCreatedEvent<GroupedKey> event) {
        eventBus.publish(InfinispanService.CODE_RELOAD_COMMAND_INTERNAL, JsonObject.mapFrom(event.getKey()));
    }

    @ClientCacheEntryModified
    public void entryModified(ClientCacheEntryModifiedEvent<GroupedKey> event) {
        eventBus.publish(InfinispanService.CODE_RELOAD_COMMAND_INTERNAL, JsonObject.mapFrom(event.getKey()));
    }

}