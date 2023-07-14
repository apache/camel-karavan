package org.apache.camel.karavan.datagrid;


import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.vertx.ConsumeEvent;
import io.vertx.core.json.JsonObject;
import org.apache.camel.karavan.datagrid.model.*;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import javax.inject.Inject;
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

    @Test
    public void testContainersStatuses() throws InterruptedException {
        ContainerInfo ci = new ContainerInfo("demo", "id", "image", List.of(8080, 8081, 8082), "dev");
        datagridService.saveContainerInfo(ci);
        List<ContainerInfo> list = datagridService.getContainerInfos("dev");
        System.out.println(list);
        assertEquals(1, list.size());
    }

    @Test
    public void sendCommand() throws InterruptedException {
        List<DevModeCommand> commandsSent = List.of(
                DevModeCommand.createForProject(DevModeCommandName.RUN, "test1"),
                DevModeCommand.createForProject(DevModeCommandName.RELOAD, "test1"),
                DevModeCommand.createForProject(DevModeCommandName.DELETE, "test1"),
                DevModeCommand.createForProject(DevModeCommandName.RUN, "test1")
        );
        commandsSent.forEach(devModeCommand -> datagridService.sendDevModeCommand(devModeCommand));

        CountDownLatch latch = new CountDownLatch(4);
        latch.await(5, TimeUnit.SECONDS);
        assertEquals(commandsSent.size(),  commandsReceived.size());
        assertEquals(commandsSent.get(0).getCommandName().name(),  commandsReceived.get(0).getCommandName().name());
        assertEquals(commandsSent.get(1).getCommandName().name(),  commandsReceived.get(1).getCommandName().name());
        assertEquals(commandsSent.get(2).getCommandName().name(),  commandsReceived.get(2).getCommandName().name());
    }

    @Test
    public void testProjectFiles() throws InterruptedException {
        List<ProjectFile> files = datagridService.getProjectFiles("xxx");
        assertEquals(0, files.size());
    }

    @Test
    public void testCamelStatuses() throws InterruptedException {
        CamelStatus cs = new CamelStatus("test1", "container1", CamelStatusName.context, "", "dev");
        datagridService.saveCamelStatus(cs);
        List<CamelStatus> list = datagridService.getCamelStatusesByEnv("dev", CamelStatusName.context);
        System.out.println(list);
        assertEquals(1, list.size());
    }
}
