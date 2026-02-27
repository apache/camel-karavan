package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.model.ActivityUser;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/ui/activity")
public class ActivityResource {

    @Inject
    KaravanCache karavanCache;

    @GET
    @Path("/projects")
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, List<String>> getProjectsActivities() {
        return karavanCache.getCopyProjectActivities().entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> new ArrayList<>(e.getValue().keySet())));
    }

    @GET
    @Authenticated
    @Path("/users")
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, Map<String, ActivityUser>> getUsersActivities() {
        return Map.of(
                ActivityUser.ActivityType.HEARTBEAT.name(), karavanCache.getCopyUsersHeartBeat(),
                ActivityUser.ActivityType.WORKING.name(), karavanCache.getCopyUsersWorking()
        );
    }

}