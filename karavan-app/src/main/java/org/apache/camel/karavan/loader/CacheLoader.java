package org.apache.camel.karavan.loader;

import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.*;
import org.apache.camel.karavan.persistence.AccessCacheEntity;
import org.apache.camel.karavan.persistence.PersistenceService;
import org.apache.camel.karavan.persistence.ProjectCacheEntity;
import org.jboss.logging.Logger;

@ApplicationScoped
public class CacheLoader {

    private static final Logger LOGGER = Logger.getLogger(CacheLoader.class);

    @Inject
    KaravanCache karavanCache;
    @Inject
    PersistenceService persistenceService;

    public void load() {
        LOGGER.info("Starting Karavan Cache Hydration...");

        var allEntities = persistenceService.getAll(ProjectCacheEntity.class);

        allEntities.stream()
                .filter(entity -> ProjectFolder.class.getSimpleName().equals(entity.type))
                .forEach(entity -> {
                    JsonObject json = new JsonObject(entity.data);
                    var project = json.mapTo(ProjectFolder.class);
                    karavanCache.saveProject(project, false);
                });

        allEntities.stream()
                .filter(entity -> ProjectFile.class.getSimpleName().equals(entity.type))
                .forEach(entity -> {
                    JsonObject json = new JsonObject(entity.data);
                    var file = json.mapTo(ProjectFile.class);
                    karavanCache.saveProjectFile(file, null, false);
                });

        persistenceService.getAll(AccessCacheEntity.class).forEach(entity -> {
            JsonObject json = new JsonObject(entity.data);
            if (AccessUser.class.getSimpleName().equals(entity.type)) {
                karavanCache.saveUser(json.mapTo(AccessUser.class), false);
            } else if (AccessRole.class.getSimpleName().equals(entity.type)) {
                karavanCache.saveRole(json.mapTo(AccessRole.class), false);
            } else if (AccessPassword.class.getSimpleName().equals(entity.type)) {
                karavanCache.savePassword(json.mapTo(AccessPassword.class), false);
            }
        });

        persistenceService.getActiveSessions().forEach(entity -> {
            JsonObject json = new JsonObject(entity.data);
            karavanCache.saveAccessSession(json.mapTo(AccessSession.class), false);
        });

        LOGGER.info("Karavan Cache Hydration complete.");
    }
}