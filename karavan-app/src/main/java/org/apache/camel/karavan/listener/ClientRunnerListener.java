package org.apache.camel.karavan.listener;

import org.apache.camel.karavan.model.GroupedKey;
import org.apache.camel.karavan.model.RunnerCommand;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryCreated;
import org.infinispan.client.hotrod.annotation.ClientCacheEntryModified;
import org.infinispan.client.hotrod.annotation.ClientListener;
import org.infinispan.client.hotrod.event.ClientCacheEntryCreatedEvent;
import org.infinispan.client.hotrod.event.ClientCacheEntryModifiedEvent;

import java.util.Objects;

@ClientListener
public class ClientRunnerListener extends RunnerListener {

    public ClientRunnerListener(InfinispanService infinispanService, KubernetesService kubernetesService) {
        super(infinispanService, kubernetesService);
    }

    @ClientCacheEntryCreated
    public void entryCreated(ClientCacheEntryCreatedEvent<GroupedKey> event) {
        System.out.println("entryCreated");
        String command = event.getKey().getKey();
        String projectId = event.getKey().getGroup();
        if (Objects.equals(command, RunnerCommand.NAME.run.name())) {
            startRunner(projectId);
        } else if (Objects.equals(command, RunnerCommand.NAME.delete.name())) {
            stopRunner(projectId);
        }
    }

    @ClientCacheEntryModified
    public void entryModified(ClientCacheEntryModifiedEvent<GroupedKey> event) {
        System.out.println("entryModified");
        String command = event.getKey().getKey();
        String projectId = event.getKey().getGroup();
        if (Objects.equals(command, RunnerCommand.NAME.run.name())) {
            startRunner(projectId);
        } else if (Objects.equals(command, RunnerCommand.NAME.delete.name())) {
            stopRunner(projectId);
        }
    }

}