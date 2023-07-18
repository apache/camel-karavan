package org.apache.camel.karavan.infinispan;


import io.quarkus.test.junit.QuarkusTest;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.CamelStatusName;
import org.apache.camel.karavan.infinispan.model.ContainerInfo;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import javax.inject.Inject;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class DataGridTest {

    @Inject
    InfinispanService infinispanService;

    @BeforeAll
    public void setup() {
        infinispanService.start();
    }

    @Test
    public void testContainersStatuses() throws InterruptedException {
        ContainerInfo ci = new ContainerInfo("demo", "id", "image", List.of(8080, 8081, 8082), "dev");
        infinispanService.saveContainerInfo(ci);
        List<ContainerInfo> list = infinispanService.getContainerInfos("dev");
        System.out.println(list);
        assertEquals(1, list.size());
    }

    @Test
    public void testProjectFiles() throws InterruptedException {
        List<ProjectFile> files = infinispanService.getProjectFiles("xxx");
        assertEquals(0, files.size());
    }

    @Test
    public void testCamelStatuses() throws InterruptedException {
        CamelStatus cs = new CamelStatus("test1", "container1", CamelStatusName.context, "", "dev");
        infinispanService.saveCamelStatus(cs);
        List<CamelStatus> list = infinispanService.getCamelStatusesByEnv("dev", CamelStatusName.context);
        System.out.println(list);
        assertEquals(1, list.size());
    }
}
