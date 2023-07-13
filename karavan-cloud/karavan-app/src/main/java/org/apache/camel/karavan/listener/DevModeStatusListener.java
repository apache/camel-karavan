package org.apache.camel.karavan.listener;

import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.datagrid.DatagridService;
import org.apache.camel.karavan.datagrid.model.DevModeStatus;
import org.apache.camel.karavan.service.CamelService;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;

@ApplicationScoped
public class DevModeStatusListener {

    private static final Logger LOGGER = Logger.getLogger(DevModeStatusListener.class.getName());

    @Inject
    CamelService camelService;

    @ConsumeEvent(value = DatagridService.ADDRESS_DEVMODE_STATUS, blocking = true, ordered = true)
    void receiveCommand(JsonObject message) {
        LOGGER.info("received Status " + message);
        DevModeStatus status = message.mapTo(DevModeStatus.class);
        if (!status.isCodeLoaded() && status.getContainerId() != null) {
            camelService.reloadProjectCode(status.getProjectId());
        }
    }
}