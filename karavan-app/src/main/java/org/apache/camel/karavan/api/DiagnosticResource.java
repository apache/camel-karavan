package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.ConfigProvider;

import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@Path("/ui/diagnostics")
public class DiagnosticResource {

    //  Environment Variables
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/env-vars")
    @Authenticated
    public List<String> getEnvVars() {
        return new ArrayList<>(System.getenv().keySet());
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/env-vars/{name}")
    @Authenticated
    public String getEnvVarValue(@PathParam("name") String name) {
        name = new String(Base64.getDecoder().decode(name));
        return new String(Base64.getEncoder().encode(System.getenv(name).getBytes()));
    }

    //  Application Properties
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/app-props")
    @Authenticated
    public List<String> getAppProps() {
        List<String> list = new ArrayList<>();
        ConfigProvider.getConfig().getPropertyNames().spliterator().forEachRemaining(list::add);
        return list;
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/app-props/{name}")
    @Authenticated
    public String getAppPropValue(@PathParam("name") String name) {
        name = new String(Base64.getDecoder().decode(name));
        return new String(Base64.getEncoder().encode(ConfigProvider.getConfig().getConfigValue(name).getValue().getBytes()));
    }
}