package org.apache.camel.karavan.generator;

import io.vertx.core.Vertx;
import org.apache.camel.kamelets.catalog.KameletsCatalog;
import org.apache.commons.io.IOUtils;
import org.jboss.logging.Logger;

import javax.inject.Inject;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

public class KameletGenerator {

    @Inject
    Vertx vertx;


    private static final Logger LOGGER = Logger.getLogger(KameletGenerator.class.getName());

    public static void generate() throws Exception {
        KameletGenerator g = new KameletGenerator();
        g.createKamelets("karavan-app/src/main/resources/kamelets");
    }

    public void createKamelets(String folder){
        LOGGER.info("Creating default Kamelets");
        KameletsCatalog catalog = new KameletsCatalog();
        catalog.getKamelets().entrySet().stream()
                .map(k -> k.getValue().getMetadata().getName())
                .forEach(name -> saveKamelet(folder, name));
        LOGGER.info("Created default Kamelets");
    }

    public void saveKamelet(String folder, String name) {
        LOGGER.info("Creating kamelet " + name);
        String fileName = name + ".kamelet.yaml";
        InputStream inputStream = KameletsCatalog.class.getResourceAsStream("/kamelets/" + fileName);
        try {
            File targetFile = Paths.get(folder, fileName).toFile();
            Files.copy(inputStream, targetFile.toPath(), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            IOUtils.closeQuietly(inputStream);
        }
    }
}
