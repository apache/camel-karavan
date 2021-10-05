package org.apache.camel.karavan.api;

import io.vertx.core.Vertx;
import org.apache.camel.karavan.service.FileSystemService;
import org.apache.camel.karavan.service.GitService;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.List;

@Path("/integration")
public class IntegrationResource {

    private static final String CLOUD_MODE = "cloud";

    @ConfigProperty(name = "karavan.mode", defaultValue = "local")
    String mode;

    @Inject
    Vertx vertx;

    @Inject
    GitService gitService;

    @Inject
    FileSystemService fileSystemService;

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<String> getList(@HeaderParam("username") String username) throws GitAPIException {
        if (mode.equals(CLOUD_MODE)){
            String dir = gitService.pullIntegrations(username);
            return fileSystemService.getIntegrationList(dir);
        } else {
            return fileSystemService.getIntegrationList();
        }
    }

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    @Path("/{name}")
    public String getYaml(@HeaderParam("username") String username, @PathParam("name") String name) throws GitAPIException {
        if (mode.equals(CLOUD_MODE)){
            String dir = gitService.pullIntegrations(username);
            return fileSystemService.getFile(dir, name);
        } else {
            return fileSystemService.getIntegrationsFile(name);
        }
    }

    @POST
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.TEXT_PLAIN)
    @Path("/{name}")
    public String save(@HeaderParam("username") String username, @PathParam("name") String name, String yaml) throws GitAPIException, IOException, URISyntaxException {
        if (mode.equals(CLOUD_MODE)){
            gitService.save(username, name, yaml);
        } else {
            fileSystemService.saveIntegrationsFile(name, yaml);
        }
        return yaml;
    }

    @PATCH
    @Produces(MediaType.TEXT_PLAIN)
    @Consumes(MediaType.TEXT_PLAIN)
    @Path("/{name}")
    public String publish(@HeaderParam("username") String username, @PathParam("name") String name, String yaml) throws GitAPIException, IOException, URISyntaxException {
        if (mode.equals(CLOUD_MODE)) {
            gitService.save(username, name, yaml);
            gitService.publish(username, name);
        }
        return yaml;
    }

    @DELETE
    @Path("/{name}")
    public void delete(@HeaderParam("username") String username, @PathParam("name") String name) throws GitAPIException, IOException, URISyntaxException {
        if (mode.equals(CLOUD_MODE)){
            gitService.delete(username, name);
        } else {
            fileSystemService.deleteIntegration(name);
        }
    }
}