package org.apache.camel.karavan.api;

import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.service.AuthService;
import org.apache.camel.karavan.service.CodeService;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Path("/platform/internal/")
public class InternalResource {

    private static final Logger LOGGER = Logger.getLogger(InternalResource.class.getName());

    private static final Map<String,String> CAMEL_DEBUG_PROPERTIES = Map.of(
            "camel.trace.enabled", "true",
            "camel.trace.standby", "false",
            "camel.debug.enabled", "true",
            "camel.debug.standby", "false",
            "camel.debug.singleStepIncludeStartEnd", "true",
            "camel.debug.breakpoints", "_all_routes_"
    );

    @Inject
    KaravanCache karavanCache;

    @Inject
    AuthService authService;

    @Inject
    CodeService codeService;

    @GET
    @PermitAll
    @Path("/sources/{projectId}")
    @Produces("application/zip")
    public Response getProjectFiles(@PathParam("projectId") String projectId, @CookieParam("sessionId") String sessionId) {
        try {
            LOGGER.info("Getting files for project " + projectId);
            authService.validateSession(sessionId);
            return getProjectFilesZipResponse(projectId, null);
        } catch (Exception e) {
            LOGGER.error("Error retrieving files for project: " + projectId, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(e.getMessage())
                    .build();
        } finally {
            authService.invalidateSession(sessionId);
        }
    }

    @GET
    @PermitAll
    @Path("/sources/{projectId}/{filename}")
    @Produces("application/zip")
    public Response getProjectFile(@PathParam("projectId") String projectId, @PathParam("filename") String filename, @CookieParam("sessionId") String sessionId) {
        try {
            LOGGER.info("Getting file " + filename + " for project " + projectId);
            authService.validateSession(sessionId);
            return getProjectFilesZipResponse(projectId, filename);

        } catch (Exception e) {
            LOGGER.error("Error retrieving file " + filename + " for project: " + projectId, e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(e.getMessage())
                    .build();
        }
    }

    private Response getProjectFilesZipResponse(String projectId, String filename) {
        LOGGER.info("Getting project files for project " + projectId);

        ProjectFolder projectFolder = karavanCache.getProject(projectId);
        if (projectFolder == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Project with given Id does not exist")
                    .build();
        }

        Map<String, String> projectFiles = new HashMap<>();

        if (filename != null) {
            var file = karavanCache.getProjectFile(projectId, filename);
            if (file == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity("File " + filename + " does not exist in project " + projectId)
                        .build();
            }
            projectFiles.put(file.getName(), file.getCode());
        } else {
            projectFiles.putAll(codeService.getProjectFilesForDevMode(projectId));
        }

        // Map<String, String> files = enableDebug(projectFiles, List.of()); // TODO: implement breakpoint
        return streamZipResponse(projectId, projectFiles);
    }

    private Response streamZipResponse(String downloadName, Map<String, String> files) {
        StreamingOutput stream = os -> {
            try (ZipOutputStream zos = new ZipOutputStream(os)) {
                for (Map.Entry<String, String> entry : files.entrySet()) {
                    ZipEntry zipEntry = new ZipEntry(entry.getKey());
                    zos.putNextEntry(zipEntry);

                    byte[] content = entry.getValue().getBytes(StandardCharsets.UTF_8);
                    zos.write(content);
                    zos.closeEntry();
                }
            }
        };

        // Format download name to ensure it safely ends with .zip
        String safeDownloadName = downloadName.replace("/", "_");
        return Response.ok(stream)
                .header("Content-Disposition", "attachment; filename=\"" + safeDownloadName + ".zip\"")
                .build();
    }

    private Map<String, String> enableDebug(Map<String, String> files, List<String> breakPoints) {
        Map<String, String> result = new HashMap<>(files.size());
        files.forEach((name, code) -> {
            if (CodeService.APPLICATION_PROPERTIES_FILENAME.equals(name)) {
                result.put(name, changeApplicationProperties(code, breakPoints));
            } else {
                result.put(name, code);
            }
        });
        return result;
    }

    private String changeApplicationProperties(String code, List<String> breakPoints) {
        Map<String, String> result = new HashMap<>();

        Map<String, String> properties = propertiesToMap(code);

        for (Map.Entry<String, String> entry : properties.entrySet()) {
            String key = entry.getKey();
            String value = CAMEL_DEBUG_PROPERTIES.getOrDefault(key, entry.getValue());
            result.put(key, value);
        }

        // Add all keys from debug that are not in properties
        for (Map.Entry<String, String> entry : CAMEL_DEBUG_PROPERTIES.entrySet()) {
            result.putIfAbsent(entry.getKey(), entry.getValue());
        }

        return result.entrySet().stream()
                .map(e -> e.getKey().concat("=").concat(e.getValue()))
                .collect(Collectors.joining(System.lineSeparator()));
    }

    private Map<String, String> propertiesToMap(String code) {
        Map<String, String> properties = new HashMap<>();
        code.lines().forEach(line -> {
            // Check for empty lines or comments to avoid IndexOutOfBoundsException
            if (line != null && !line.trim().isEmpty() && !line.trim().startsWith("#")) {
                var parts = line.split("=", 2);
                if (parts.length == 2) {
                    var key = parts[0].trim();
                    var value = parts[1].trim();
                    properties.put(key, value);
                }
            }
        });
        return properties;
    }
}