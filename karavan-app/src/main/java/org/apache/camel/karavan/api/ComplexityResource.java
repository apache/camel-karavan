package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.complexity.ComplexityProject;
import org.apache.camel.karavan.service.ComplexityService;
import org.jboss.logging.Logger;

import java.util.ArrayList;
import java.util.List;

@Path("/ui/complexity")
public class ComplexityResource {

    private static final Logger LOGGER = Logger.getLogger(ComplexityResource.class.getName());

    @Inject
    ComplexityService complexityService;

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_JSON)
    public List<ComplexityProject> getProjectComplexities() {
        try {
            return complexityService.getProjectComplexities();
        } catch (Exception e) {
            LOGGER.error("Error getting project complexities", e);
            return new ArrayList<>();
        }
    }

    @GET
    @Authenticated
    @Path("/{projectId}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getProjectComplexity(@PathParam("projectId") String projectId) {
        try {
            return Response.ok(complexityService.getProjectComplexity(projectId)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }
}