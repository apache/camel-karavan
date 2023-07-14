package org.apache.camel.karavan.datagrid;

import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.datagrid.model.GroupedKey;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryCreated;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryModified;
import org.infinispan.client.hotrod.annotation.ClientListener;
import org.infinispan.client.hotrod.event.ClientCacheEntryCreatedEvent;
import org.infinispan.client.hotrod.event.ClientCacheEntryModifiedEvent;

@ClientListener
public class DevModeStatusListener {

    private final EventBus eventBus;

    public DevModeStatusListener(EventBus eventBus) {
        this.eventBus = eventBus;
    }

    @ClientCacheEntryCreated
    public void entryCreated(ClientCacheEntryCreatedEvent<GroupedKey> event) {
        eventBus.publish(DatagridService.ADDRESS_DEVMODE_STATUS_INTERNAL, JsonObject.mapFrom(event.getKey()));
    }

    @ClientCacheEntryModified
    public void entryModified(ClientCacheEntryModifiedEvent<GroupedKey> event) {
        eventBus.publish(DatagridService.ADDRESS_DEVMODE_STATUS_INTERNAL, JsonObject.mapFrom(event.getKey()));
    }

}