package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.model.SearchResult;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Path("/ui/search")
public class SearchResource {

    @Inject
    KaravanCache karavanCache;

    @GET
    @Authenticated
    @Path("/all/{encoded}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response searchAll(@PathParam("encoded") String encoded) {
        Map<String, List<String>> result = new HashMap<>();
        try {
            String search = URLDecoder.decode(encoded, StandardCharsets.UTF_8);
            for (ProjectFolder p : karavanCache.getFolders()) {
                for (ProjectFile f : karavanCache.getProjectFiles(p.getProjectId())) {
                    if (f.getCode() != null && f.getCode().toLowerCase().contains(search.toLowerCase())){
                        var list = result.getOrDefault(p.getProjectId(), new ArrayList<>());
                        list.add(f.getName());
                        result.put(p.getProjectId(), list);
                    }
                }
            }
            return Response.ok(result.entrySet().stream().map(e -> new SearchResult(e.getKey(), e.getValue())).toList()).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(e.getMessage()).build();
        }
    }
}