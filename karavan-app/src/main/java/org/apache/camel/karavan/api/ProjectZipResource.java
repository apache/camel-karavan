package org.apache.camel.karavan.api;

import io.quarkus.security.Authenticated;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.json.JsonArray;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.apache.camel.karavan.cache.ProjectFolder;
import org.apache.camel.karavan.service.CodeService;
import org.apache.camel.karavan.service.ZipService;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Path("/ui/zip")
public class ProjectZipResource {

    private static final Logger LOGGER = Logger.getLogger(ProjectZipResource.class.getName());

    @Inject
    ZipService zipService;

    @Inject
    CodeService codeService;

    @Inject
    KaravanCache karavanCache;

    @POST
    @Path("/project")
    @Authenticated
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    public Response uploadFile(@RestForm("file") FileUpload file, @RestForm("name") String name) throws Exception {
        try {
            var filePath = file.uploadedFile();
            Map<String, byte[]> zipEntries = getZipEntries(filePath);
            var appPropertiesBytes = zipEntries.get(CodeService.APPLICATION_PROPERTIES_FILENAME);
            var projectData = getProjectId(appPropertiesBytes);
            if (karavanCache.getProject(projectData.getItem1()) == null) {
                var project = new ProjectFolder(projectData.getItem1(), projectData.getItem2());
                karavanCache.saveProject(project);
                zipEntries.entrySet().stream().filter(e -> !e.getKey().startsWith(".")).forEach(e -> {
                    var pf = new ProjectFile(e.getKey(), new String(e.getValue()), project.getProjectId(), Instant.now().toEpochMilli());
                    karavanCache.saveProjectFile(pf, false);
                });
                return Response.ok().entity(JsonArray.of(zipEntries.keySet())).build();
            } else {
                return Response.notModified().entity(name).build();
            }
        } catch (Exception e) {
            LOGGER.error("Error uploading file", e);
            return Response.serverError().entity(e.getMessage()).build();
        }
    }

    private Map<String, byte[]> getZipEntries(java.nio.file.Path filePath) throws Exception {
        Map<String, byte[]> zipEntries = new HashMap<>();
        try (InputStream inputStream = Files.newInputStream(filePath);
             ZipInputStream zipInputStream = new ZipInputStream(inputStream)) {

            ZipEntry entry;
            while ((entry = zipInputStream.getNextEntry()) != null) {
                if (!entry.isDirectory()) {
                    byte[] entryBytes = getBytesFromZipEntry(zipInputStream);
                    String fileName = Paths.get(entry.getName()).getFileName().toString();
                    zipEntries.put(fileName, entryBytes);
                    zipInputStream.closeEntry();
                }
            }
        }
        return zipEntries;
    }

    private Tuple2<String, String> getProjectId(byte[] appPropertiesBytes) {
        var code = new String(appPropertiesBytes);
        var projectId = codeService.getProjectId(code);
        var projectName = codeService.getProjectName(code);
        return Tuple2.of(projectId, projectName);
    }

    private byte[] getBytesFromZipEntry(ZipInputStream zipInputStream) throws IOException {
        try (ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[1024];
            int bytesRead;
            while ((bytesRead = zipInputStream.read(buffer)) != -1) {
                byteArrayOutputStream.write(buffer, 0, bytesRead);
            }
            return byteArrayOutputStream.toByteArray();
        }
    }

    @GET
    @Authenticated
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @Path("/project/{projectId}")
    public Response downloadFile(@PathParam("projectId") String projectId) throws IOException {
        byte[] bytes = zipService.zipProject(projectId);
        return Response.ok(bytes, MediaType.APPLICATION_OCTET_STREAM)
                .header("Content-Disposition", "attachment; filename=\"" + projectId + ".zip\"")
                .build();
    }
}