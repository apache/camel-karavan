package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.apache.camel.karavan.cache.KaravanCache;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/ui/activity")
public class ActivityResource {

    private static final Logger LOGGER = Logger.getLogger(ActivityResource.class.getName());

    @Inject
    KaravanCache karavanCache;

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, List<String>> getProjectActivities() {
        return karavanCache.getCopyProjectActivities().entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> new ArrayList<>(e.getValue().keySet())));
    }

}