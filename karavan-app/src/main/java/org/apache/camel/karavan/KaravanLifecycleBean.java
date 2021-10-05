package org.apache.camel.karavan;

import io.quarkus.runtime.StartupEvent;
import org.apache.camel.karavan.service.FileSystemService;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import java.io.IOException;
import java.net.URISyntaxException;

@ApplicationScoped
public class KaravanLifecycleBean {

    @ConfigProperty(name = "karavan.mode", defaultValue = "local")
    String mode;

    @Inject
    FileSystemService fileSystemService;

    private static final Logger LOGGER = Logger.getLogger(KaravanLifecycleBean.class.getName());

    void onStart(@Observes StartupEvent ev) throws IOException, GitAPIException, URISyntaxException {
        LOGGER.info("Karavan is starting in " + mode + " mode");
        if (mode.equals("local")) {
            fileSystemService.createIntegrationsFolder();
        }
    }
}
