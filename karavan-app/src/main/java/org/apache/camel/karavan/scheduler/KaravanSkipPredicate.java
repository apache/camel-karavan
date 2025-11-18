package org.apache.camel.karavan.scheduler;

import io.quarkus.scheduler.Scheduled;
import io.quarkus.scheduler.ScheduledExecution;
import io.quarkus.vertx.ConsumeEvent;
import jakarta.inject.Singleton;

import static org.apache.camel.karavan.KaravanEvents.NOTIFICATION_PROJECTS_STARTED;


@Singleton
public class KaravanSkipPredicate implements Scheduled.SkipPredicate {

    private static boolean skip = true;

    @ConsumeEvent(value = NOTIFICATION_PROJECTS_STARTED)
    void getInfinispanNotificationStarted(String message) {
        skip = false;
    }

    @Override
    public boolean test(ScheduledExecution execution) {
        return skip;
    }
}
