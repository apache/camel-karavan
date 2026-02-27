package org.apache.camel.karavan.persistence;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import org.apache.camel.karavan.cache.AccessSession;
import org.apache.camel.karavan.cache.CacheEvent;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import static org.apache.camel.karavan.KaravanEvents.*;

@ApplicationScoped
public class PersistenceService {

    private static final Logger LOGGER = Logger.getLogger(PersistenceService.class.getName());

    @Inject
    EntityManager entityManager;

    private static final String SAVE_SQL =
            "INSERT INTO %s (key, type, data, last_update) " +
                    "VALUES (:key, :type, CAST(:data AS jsonb), :now) " +
                    "ON CONFLICT (key) DO UPDATE SET " +
                    "type = EXCLUDED.type, " +
                    "data = EXCLUDED.data, " +
                    "last_update = EXCLUDED.last_update";

    private static final String SAVE_SESSION_SQL =
            "INSERT INTO session_state (key, type, data, expiry, last_update) " + // Added expiry
                    "VALUES (:key, :type, CAST(:data AS jsonb), :expiry, :now) " +
                    "ON CONFLICT (key) DO UPDATE SET " +
                    "type = EXCLUDED.type, data = EXCLUDED.data, " +
                    "expiry = EXCLUDED.expiry, last_update = EXCLUDED.last_update";

    private static final String DELETE_SQL = "DELETE FROM %s WHERE key = :key";

    @ConsumeEvent(value = PERSIST_PROJECT, blocking = true, ordered = true)
    @Transactional
    public void handleProjectUpdate(CacheEvent event) {
        execute(ProjectCacheEntity.TABLE_NAME, event);
    }

    @ConsumeEvent(value = PERSIST_ACCESS, blocking = true, ordered = true)
    @Transactional
    public void handleAccessUpdate(CacheEvent event) {
        execute(AccessCacheEntity.TABLE_NAME, event);
    }

    @ConsumeEvent(value = PERSIST_SESSION, blocking = true, ordered = true)
    @Transactional
    public void handleSessionUpdate(CacheEvent event) {
        execute(SessionCacheEntity.TABLE_NAME, event);
    }

    private void execute(String tableName, CacheEvent event) {
        try {
            Query query;
            if (event.operation().equals(CacheEvent.Operation.SAVE)) {
                String json = Objects.requireNonNull(JsonObject.mapFrom(event.data())).encode();
                String entityName = event.data().getClass().getSimpleName();

                String sql = tableName.equals(SessionCacheEntity.TABLE_NAME) ? SAVE_SESSION_SQL : String.format(SAVE_SQL, tableName);

                query = entityManager.createNativeQuery(String.format(sql, tableName))
                        .setParameter("key", event.key())
                        .setParameter("type", entityName)
                        .setParameter("data", json)
                        .setParameter("now", Instant.now());

                if (event.data() instanceof AccessSession s) {
                    query.setParameter("expiry", s.getExpiredAt());
                }
            } else {
                query = entityManager.createNativeQuery(String.format(DELETE_SQL, tableName))
                        .setParameter("key", event.key());
            }
            query.executeUpdate();
        } catch (Exception e) {
            LOGGER.errorf(e, "Failed to persist event %s in %s with key %s", event.operation(), tableName, event.key());
        }
    }

    /**
     * Fetches all records from a specific cache table as Entity objects.
     */
    public <T> List<T> getAll(Class<T> entityClass) {
        String jpql = "SELECT e FROM " + entityClass.getSimpleName() + " e";
        return entityManager.createQuery(jpql, entityClass).getResultList();
    }

    /**
     * Fetches only active sessions.
     */
    public List<SessionCacheEntity> getActiveSessions() {
        String jpql = "SELECT e FROM SessionCacheEntity e WHERE e.expiry > :now";
        return entityManager.createQuery(jpql, SessionCacheEntity.class)
                .setParameter("now", Instant.now())
                .getResultList();
    }
}