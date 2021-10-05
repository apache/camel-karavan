package org.apache.camel.karavan.api;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.RestResponse;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import java.util.Map;

@Path("/configuration")
public class ConfigurationResource {

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.mode")
    String mode;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public RestResponse<Map<String, String>> getConfiguration() throws Exception {

        return RestResponse.ResponseBuilder.ok(
                Map.of(
                        "karavan.version", version,
                        "karavan.mode", mode
                )
        ).build();
    }

}