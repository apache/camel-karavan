package org.apache.camel.karavan.bashi;

import org.apache.camel.karavan.bashi.docker.DockerService;
import org.apache.camel.karavan.bashi.docker.LogCallback;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.DevModeCommand;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ApplicationScoped
public class LoggerService {

    private static final Logger LOGGER = Logger.getLogger(LoggerService.class.getName());

    @Inject
    DockerService dockerService;

    @Inject
    DatagridService datagridService;

    private final Map<String, LogCallback> loggers = new ConcurrentHashMap<>();

    void logContainer(DevModeCommand command) {
        try {
            String containerName = command.getContainerName();
            LogCallback callback = loggers.get(containerName);
            if (callback != null) {
                callback.close();
                loggers.remove(containerName);
            } else {
                callback = dockerService.logContainer(containerName);
                loggers.put(containerName, callback);
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage());
        }
    }
}