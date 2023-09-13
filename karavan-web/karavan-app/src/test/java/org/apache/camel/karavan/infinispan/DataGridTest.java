package org.apache.camel.karavan.infinispan;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.apache.camel.karavan.infinispan.InfinispanService;
import org.apache.camel.karavan.infinispan.model.CamelStatus;
import org.apache.camel.karavan.infinispan.model.ProjectFile;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class DataGridTest {

    @Inject
    InfinispanService infinispanService;

    @BeforeAll
    public void setup() throws Exception {
        infinispanService.start();
    }

    @Test
    public void testProjectFiles() throws InterruptedException {
        List<ProjectFile> files = infinispanService.getProjectFiles("xxx");
        assertEquals(0, files.size());
    }

    @Test
    public void testCamelStatuses() throws InterruptedException {
//        CamelStatus cs = new CamelStatus("test1", "container1", CamelStatus.Name.context, "", "dev");
//        infinispanService.saveCamelStatus(cs);
//        List<CamelStatus> list = infinispanService.getCamelStatusesByEnv("dev", CamelStatus.Name.context);
//        assertEquals(1, list.size());
    }
}
