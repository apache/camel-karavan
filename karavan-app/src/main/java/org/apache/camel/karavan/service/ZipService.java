package org.apache.camel.karavan.service;

import io.vertx.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCache;
import org.apache.camel.karavan.cache.ProjectFile;
import org.jboss.logging.Logger;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@ApplicationScoped
public class ZipService {

    private static final Logger LOGGER = Logger.getLogger(ZipService.class.getName());

    @Inject
    Vertx vertx;

    @Inject
    KaravanCache karavanCache;

    public byte[] zipProject(String projectId) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(baos)) {
            for (ProjectFile projectFile : karavanCache.getProjectFiles(projectId)) {
                ZipEntry entry = new ZipEntry(projectFile.getName());
                zos.putNextEntry(entry);
                zos.write(projectFile.getCode().getBytes());
                zos.closeEntry();
            }
        } catch (IOException ioe) {
            LOGGER.error("Error saving project", ioe);
        }
        baos.close();
        return baos.toByteArray();
    }

    public String saveProject(String projectId) {
        String uuid = UUID.randomUUID().toString();
        String folder = vertx.fileSystem().createTempDirectoryBlocking(uuid);
        String fileName = folder + File.separator + projectId + ".zip";
        try (FileOutputStream fos = new FileOutputStream(fileName);
                ZipOutputStream zos = new ZipOutputStream(fos)) {
            for (ProjectFile projectFile : karavanCache.getProjectFiles(projectId)) {
                ZipEntry entry = new ZipEntry(projectFile.getName());
                zos.putNextEntry(entry);
                zos.write(projectFile.getCode().getBytes());
                zos.closeEntry();
            }
        } catch (IOException ioe) {
            LOGGER.error("Error saving project", ioe);
        }
        return fileName;
    }
}