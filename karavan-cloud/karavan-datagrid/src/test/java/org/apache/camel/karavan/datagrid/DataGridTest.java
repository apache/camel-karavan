package org.apache.camel.karavan.datagrid;


import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.datagrid.model.CommandName;
import org.apache.camel.karavan.datagrid.model.DevModeCommand;
import org.apache.camel.karavan.datagrid.model.ProjectFile;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import javax.inject.Inject;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class DataGridTest {

    @Inject
    DatagridService datagridService;

    private List<DevModeCommand> commandsReceived = new ArrayList<>();

    @BeforeAll
    public void setup() {
        datagridService.start();
        commandsReceived.clear();
    }

    @ConsumeEvent(DatagridService.ADDRESS_DEVMODE_COMMAND)
    void receiveCommand(JsonObject message) {
        System.out.println("receiveCommand " + message);
        commandsReceived.add(message.mapTo(DevModeCommand.class));
    }

//    @Test
    public void sendCommand() throws InterruptedException {
        List<DevModeCommand> commandsSent = List.of(
                new DevModeCommand(CommandName.RUN, Instant.now().toEpochMilli()),
                new DevModeCommand(CommandName.RELOAD, Instant.now().toEpochMilli()),
                new DevModeCommand(CommandName.DELETE, Instant.now().toEpochMilli()),
                new DevModeCommand(CommandName.RUN, Instant.now().toEpochMilli())
        );
        commandsSent.forEach(devModeCommand -> datagridService.sendDevModeCommand("test1", devModeCommand));

        CountDownLatch latch = new CountDownLatch(4);
        latch.await(5, TimeUnit.SECONDS);
        assertEquals(commandsSent.size(),  commandsReceived.size());
        assertEquals(commandsSent.get(0).getCommandName().name(),  commandsReceived.get(0).getCommandName().name());
        assertEquals(commandsSent.get(1).getCommandName().name(),  commandsReceived.get(1).getCommandName().name());
        assertEquals(commandsSent.get(2).getCommandName().name(),  commandsReceived.get(2).getCommandName().name());
    }

    @Test
    public void getProjectFiles() throws InterruptedException {
        List<ProjectFile> files = datagridService.getProjectFiles("xxx");
        assertEquals(0, files.size());
    }
}
