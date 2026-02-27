package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFolderCommit;
import org.apache.camel.karavan.cache.SystemCommit;
import org.apache.camel.karavan.service.GitHistoryService;
import org.jboss.logging.Logger;

import java.util.List;

@Path("/ui/git")
public class GitCommitResource {

    private static final Logger LOGGER = Logger.getLogger(GitCommitResource.class.getName());

    @Inject
    GitHistoryService gitHistoryService;

    @Inject
    KaravanCache karavanCache;

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/commits/{projectId}")
    public List<ProjectFolderCommit> getProjectCommits(@PathParam("projectId")  String projectId) {
        try {
            return karavanCache.getProjectLastCommits(projectId);
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e);
            return List.of();
        }
    }

    @POST
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/commits/{projectId}")
    public Response loadProjectCommits(@PathParam("projectId") String projectId) {
        try {
            gitHistoryService.importProjectCommits(projectId);
            return Response.accepted().build();
        }  catch (Exception e) {
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    @Path("/system")
    public List<SystemCommit> getSystemCommits() {
        try {
            return karavanCache.getSystemLastCommits();
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e);
            return List.of();
        }
    }
}