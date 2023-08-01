package org.apache.camel.karavan.infinispan;


import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.vertx.ConsumeEvent;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class DataGridTest {

    @Inject
    InfinispanService infinispanService;

    @BeforeAll
    public void setup() {
        infinispanService.start(true);
    }

    @Test
    public void testProjectFiles() throws InterruptedException {
        List<ProjectFile> files = infinispanService.getProjectFiles("xxx");
        assertEquals(0, files.size());
    }

    @Test
    public void testCamelStatuses() throws InterruptedException {
        CamelStatus cs = new CamelStatus("test1", "container1", CamelStatus.Name.context, "", "dev");
        infinispanService.saveCamelStatus(cs);
        List<CamelStatus> list = infinispanService.getCamelStatusesByEnv("dev", CamelStatus.Name.context);
        assertEquals(1, list.size());
    }


    private List<String> commandsReceived = new ArrayList<>();
    @ConsumeEvent(InfinispanService.CODE_RELOAD_COMMAND)
    void receiveCommand(String message) {
        System.out.println("receiveCommand " + message);
        commandsReceived.add(message);
    }

    @Test
    public void sendCommand() throws InterruptedException {
        List<String> commandsSent = List.of("test1", "test2", "test3", "test1");

        commandsSent.forEach(project -> infinispanService.sendCodeReloadCommand(project));

        CountDownLatch latch = new CountDownLatch(4);
        latch.await(5, TimeUnit.SECONDS);
        assertEquals(commandsSent.size(),  commandsReceived.size());
    }
}
