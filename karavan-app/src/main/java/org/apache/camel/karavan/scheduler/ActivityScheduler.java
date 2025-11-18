package org.apache.camel.karavan.scheduler;

import io.quarkus.scheduler.Scheduled;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.model.ActivityProject;

import static org.apache.camel.karavan.KaravanEvents.ON_PROJECT_ACTIVITY;

@ApplicationScoped
public class ActivityScheduler {

    @Inject
    EventBus eventBus;

    @Scheduled(every = "1m", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    public void activityCleanup() throws Exception {
        eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(ActivityProject.createDelete()));
    }
}