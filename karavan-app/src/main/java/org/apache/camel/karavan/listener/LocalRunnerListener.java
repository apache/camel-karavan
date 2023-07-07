package org.apache.camel.karavan.listener;

import org.apache.camel.karavan.model.GroupedKey;
import org.apache.camel.karavan.model.RunnerCommand;
import org.apache.camel.karavan.service.InfinispanService;
import org.apache.camel.karavan.service.KubernetesService;
import org.infinispan.notifications.Listener;
import org.infinispan.notifications.cachelistener.annotation.CacheEntryCreated;
import org.infinispan.notifications.cachelistener.annotation.CacheEntryModified;
import org.infinispan.notifications.cachelistener.event.CacheEntryCreatedEvent;
import org.infinispan.notifications.cachelistener.event.CacheEntryModifiedEvent;

import java.util.Objects;


@Listener(primaryOnly = true)
public class LocalRunnerListener extends RunnerListener {

    public LocalRunnerListener(InfinispanService infinispanService, KubernetesService kubernetesService) {
        super(infinispanService, kubernetesService);
    }

    @CacheEntryCreated
    public void entryCreated(CacheEntryCreatedEvent<GroupedKey, String> event) {
        if (!event.isPre()) {
            String command = event.getKey().getKey();
            String projectId = event.getKey().getGroup();
            if (Objects.equals(command, RunnerCommand.NAME.run.name())) {
                startRunner(projectId);
            } else if (Objects.equals(command, RunnerCommand.NAME.delete.name())) {
                stopRunner(projectId);
            }
        }
    }

    @CacheEntryModified
    public void entryModified(CacheEntryModifiedEvent<GroupedKey, String> event) {
        if (!event.isPre()) {
            String command = event.getKey().getKey();
            String projectId = event.getKey().getGroup();
            if (Objects.equals(command, RunnerCommand.NAME.run.name())) {
                startRunner(projectId);
            } else if (Objects.equals(command, RunnerCommand.NAME.delete.name())) {
                stopRunner(projectId);
            }
        }
    }
}