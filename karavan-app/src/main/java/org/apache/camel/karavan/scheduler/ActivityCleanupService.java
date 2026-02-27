package org.apache.camel.karavan.scheduler;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCache;

import java.time.Instant;

@ApplicationScoped
public class ActivityCleanupService {

    private static final long THRESHOLD = 120000;

    @Inject
    KaravanCache karavanCache;

    @Scheduled(every = "2m") // Run every 2 minutes
    void deleteUsersActivities() {

        karavanCache.getCopyUsersWorking().entrySet().stream()
                .filter(e -> {
                    var lastTimestamp = Instant.ofEpochMilli(e.getValue().getTimeStamp()).plusMillis(THRESHOLD);
                    return Instant.now().isAfter(lastTimestamp);
                })
                .forEach(e -> karavanCache.deleteUserWorking(e.getKey()));

        karavanCache.getCopyUsersHeartBeat().entrySet().stream()
                .filter(e -> {
                    var lastTimestamp = Instant.ofEpochMilli(e.getValue().getTimeStamp()).plusMillis(THRESHOLD);
                    return Instant.now().isAfter(lastTimestamp);
                })
                .forEach(e -> karavanCache.deleteUserHeartBeat(e.getKey()));
    }
}