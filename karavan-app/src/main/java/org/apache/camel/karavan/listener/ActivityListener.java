package org.apache.camel.karavan.listener;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.eventbus.EventBus;
import io.vertx.core.json.JsonObject;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.model.ActivityCommand;
import org.apache.camel.karavan.model.ActivityContainer;
import org.apache.camel.karavan.model.ActivityProject;
import org.apache.camel.karavan.model.ActivityUser;
import org.apache.camel.karavan.service.ConfigService;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

import static org.apache.camel.karavan.KaravanEvents.*;

@ApplicationScoped
public class ActivityListener {

    private static final Logger LOGGER = Logger.getLogger(ActivityListener.class.getName());


    @ConfigProperty(name = "karavan.environment", defaultValue = KaravanConstants.DEV)
    String environment;

    @Inject
    KaravanCache karavanCache;

    @Inject
    EventBus eventBus;

    @ConsumeEvent(value = ON_USER_ACTIVITY, ordered = true)
    public void onUserActivity(JsonObject json) {
        var activityUser = json.mapTo(ActivityUser.class);
        if (Objects.isNull(activityUser)) {
        } else if (ActivityUser.ActivityType.WORKING.equals(activityUser.getType())) {
            karavanCache.saveUserWorking(activityUser);
        } else {
            karavanCache.saveUserHeartBeat(activityUser);
        }

    }

    @ConsumeEvent(value = ON_PROJECT_ACTIVITY, ordered = true)
    public void onProjectActivity(JsonObject json) {
        try {
            var ap = json.mapTo(ActivityProject.class);
            if (Objects.equals(ap.getCommand(), ActivityCommand.ADD)
                    && !Objects.equals(ap.getProjectId(), "undefined")
                    && Objects.nonNull(ap.getUserName())
                    && !ap.getUserName().isEmpty()) {
                karavanCache.saveActivityProject(ap.getProjectId(), ap.getUserName(), ap.getTimeStamp());
            } else {
                Instant limit = Instant.now().minus(5, ChronoUnit.MINUTES);
                karavanCache.clearExpiredActivity(limit);
            }
        } catch (Exception ignore) {}
    }

    @ConsumeEvent(value = ON_CONTAINER_ACTIVITY, ordered = true)
    public void onContainerActivity(JsonObject json) {
//        LOGGER.info("onContainerActivity " + json.encodePrettily());
        try {
            var ac = json.mapTo(ActivityContainer.class);
            if (ConfigService.inKubernetes()) {
                var podContainerStatus = karavanCache.getPodContainerStatus(ac.getContainerName(), environment);
                if (podContainerStatus != null) {
                    eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(ActivityProject.createAdd(ac.getUserName(), podContainerStatus.getProjectId())));
                }
            } else {
                eventBus.publish(ON_PROJECT_ACTIVITY, JsonObject.mapFrom(ActivityProject.createAdd(ac.getUserName(), ac.getContainerName())));
            }
        } catch (Exception ignore) {}
    }
}