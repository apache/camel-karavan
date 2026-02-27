package org.apache.camel.karavan.scheduler;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCache;

import java.time.Instant;

@ApplicationScoped
public class SessionCleanupService {

    @Inject
    KaravanCache karavanCache;

    @Scheduled(every = "10m") // Run every 10 minutes
    void deleteExpiredSessions() {

        karavanCache.getAccessSessions().stream()
                .filter(s -> Instant.now().isAfter(s.expiredAt))
                .forEach(session -> karavanCache.deleteAccessSession(session.sessionId));
    }
}