package org.apache.camel.karavan.service;

import io.vertx.core.Vertx;
import io.vertx.core.buffer.Buffer;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class FileSystemService {


    @ConfigProperty(name = "karavan.folder.integrations")
    String integrations;

    @Inject
    Vertx vertx;

    private static final Logger LOGGER = Logger.getLogger(FileSystemService.class.getName());

    public void createIntegrationsFolder() throws IOException {
        createFolder(integrations);
    }

    private void createFolder(String name) throws IOException {
        LOGGER.info("Creating folder " + name);
        if (!Files.exists(Paths.get(name))) {
            Path path = Files.createDirectory(Path.of(name));
            LOGGER.info("Folder " + path + " created");
        } else {
            getIntegrationList().forEach(s -> LOGGER.info("Integration found: " + s));
        }
    }

    public List<String> getIntegrationList() {
        return getIntegrationList(integrations);
    }

    public List<String> getIntegrationList(String folder) {
        return vertx.fileSystem().readDirBlocking(Paths.get(folder).toString())
                .stream()
                .filter(s -> s.endsWith(".yaml"))
                .map(s -> {
                    String[] parts = s.split("/");
                    return parts[parts.length - 1];
                }).collect(Collectors.toList());
    }

    public String getIntegrationsFile(String name) throws GitAPIException {
        return vertx.fileSystem().readFileBlocking(Paths.get(integrations, name).toString()).toString();
    }

    public String getFile(String folder, String name) throws GitAPIException {
        return vertx.fileSystem().readFileBlocking(Paths.get(folder, name).toString()).toString();
    }

    public void saveIntegrationsFile(String name, String yaml) throws GitAPIException, IOException {
        vertx.fileSystem().writeFileBlocking(Paths.get(integrations, name).toString(), Buffer.buffer(yaml));
    }

    public void saveFile(String folder, String name, String yaml) throws GitAPIException, IOException {
        vertx.fileSystem().writeFileBlocking(Paths.get(folder, name).toString(), Buffer.buffer(yaml));
    }

    public void delete(String folder, String name) {
        vertx.fileSystem().deleteBlocking(Paths.get(folder, name).toString());
    }

    public void deleteIntegration(String name) {
        vertx.fileSystem().deleteBlocking(Paths.get(integrations, name).toString());
    }
}
