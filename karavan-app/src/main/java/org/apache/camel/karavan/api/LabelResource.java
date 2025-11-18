package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.apache.camel.karavan.KaravanConstants;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.service.CodeService;
import org.jboss.logging.Logger;

import java.util.*;

import static org.apache.camel.karavan.service.CodeService.APPLICATION_PROPERTIES_FILENAME;

@Path("/ui/labels")
public class LabelResource {

    private static final Logger LOGGER = Logger.getLogger(LabelResource.class.getName());

    @Inject
    KaravanCache karavanCache;

    @Inject
    CodeService codeService;

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    public Map<String, List<String>> getProjectLabels() {
        Map<String, List<String>> result = new HashMap<>();
        karavanCache.getProjectFilesByName(APPLICATION_PROPERTIES_FILENAME).forEach(file -> {
            var labels = codeService.getPropertyValueByKeyContains(file.getCode(), KaravanConstants.PROPERTY_PROJECT_LABELS);
            var list = labels == null ? new ArrayList<String>() : Arrays.stream(labels.split(",")).map(String::trim).map(String::toLowerCase).toList();
            result.put(file.getProjectId(), list);
        });
        return result;
    }
}