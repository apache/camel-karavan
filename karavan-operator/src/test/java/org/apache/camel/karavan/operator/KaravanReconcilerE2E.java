package org.apache.camel.karavan.operator;

import io.fabric8.kubernetes.api.model.*;
import io.fabric8.kubernetes.api.model.apps.Deployment;
import io.fabric8.kubernetes.api.model.rbac.Role;
import io.fabric8.kubernetes.api.model.rbac.RoleBinding;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.fabric8.openshift.api.model.Route;
import io.fabric8.tekton.pipeline.v1beta1.Pipeline;
import io.fabric8.tekton.pipeline.v1beta1.Task;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.spec.KaravanSpec;
import org.apache.camel.karavan.operator.spec.KaravanStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;


import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static java.util.concurrent.TimeUnit.MINUTES;
import static org.awaitility.Awaitility.await;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.*;

public class KaravanReconcilerE2E {
    private static final String DEFAULT_NAMESPACE = "default";

    KubernetesClient client;

    @BeforeEach
    void createKubernetesClient() {
        client = new KubernetesClientBuilder().build();
    }
    private Karavan buildKaravan() {
        var karavan = new Karavan();
        karavan.setMetadata(new ObjectMetaBuilder().withName("karavan").withNamespace(DEFAULT_NAMESPACE).build());
        karavan.setSpec(new KaravanSpec(1, "public", "demo", "quarkus,spring-boot", 30668, "10s"));

        return karavan;
    }

    private class Obj {
        Class<? extends HasMetadata> type;
        String name;

        public Obj(Class<? extends HasMetadata> type, String name) {
            this.type = type;
            this.name = name;
        }
    }

    private List<Obj> getResources() {
        var array = new ArrayList<>(Arrays.asList(
                new Obj(Deployment.class, "karavan"),
                new Obj(Service.class, "karavan"),
                new Obj(ServiceAccount.class, "karavan"),
                new Obj(Role.class, "karavan"),
                new Obj(RoleBinding.class, "karavan"),
                new Obj(RoleBinding.class, "karavan-view"),
                new Obj(PersistentVolumeClaim.class, "karavan-data"),
                new Obj(PersistentVolumeClaim.class, "karavan-m2-cache"),
                new Obj(PersistentVolumeClaim.class, "karavan-jbang-cache")
        ));
        if (Utils.isOpenShift(client)) {
            array.add(new Obj(Route.class, "karavan"));
        }
        return array;
    }

    private List<Obj> getTektonResources() {
        var array = new ArrayList<>(Arrays.asList(
                new Obj(Task.class, "karavan-task-dev-quarkus"),
                new Obj(Task.class, "karavan-task-dev-spring-boot"),
                new Obj(Pipeline.class, "karavan-pipeline-dev-quarkus"),
                new Obj(Pipeline.class, "karavan-pipeline-dev-spring-boot"),
                new Obj(ServiceAccount.class, "pipeline"),
                new Obj(Role.class, "deployer"),
                new Obj(RoleBinding.class, "pipeline-deployer")
        ));
        if (Utils.isOpenShift(client)) {
            array.add(new Obj(Route.class, "karavan"));
        }
        return array;
    }

    private void deleteKaravan(Karavan karavan) {
        client.resources(Karavan.class).inNamespace(DEFAULT_NAMESPACE).withName(karavan.getMetadata().getName()).delete();
        await().atMost(5, MINUTES).ignoreExceptions().untilAsserted(() -> {
            getResources().forEach(c -> assertNull(client.resources(c.type).inNamespace(DEFAULT_NAMESPACE).withName(c.name).get()));
        });
    }

    @Test
    @Order(1)
    void basicOperatorTest() {
        var karavan = buildKaravan();
        client.resource(karavan).create();

        await().atMost(5, MINUTES).ignoreExceptions().untilAsserted(() -> {
            Karavan updatedKaravan = client.resources(Karavan.class).inNamespace(DEFAULT_NAMESPACE).withName("karavan").get();
            assertThat(updatedKaravan.getStatus(), is(notNullValue()));
            assertThat(updatedKaravan.getStatus().getState(), is(KaravanStatus.State.READY));
        });

        getResources().forEach(c -> assertNotNull(client.resources(c.type).inNamespace(DEFAULT_NAMESPACE).withName(c.name).get()));
        await().atMost(5, MINUTES).ignoreExceptions().untilAsserted(() -> {
            var deployment = client.resources(Deployment.class).inNamespace(DEFAULT_NAMESPACE).withName("karavan").get();
            assertNotNull(deployment);
            assertEquals(deployment.getSpec().getReplicas(), deployment.getStatus().getAvailableReplicas());
        });

        deleteKaravan(karavan);
    }

    @Test
    @Order(2)
    void installTektonTest() throws FileNotFoundException {
        var karavan = buildKaravan();
        client.resource(karavan).create();

        await().atMost(5, MINUTES).ignoreExceptions().untilAsserted(() -> {
            Karavan updatedKaravan = client.resources(Karavan.class).inNamespace(DEFAULT_NAMESPACE).withName("karavan").get();
            assertThat(updatedKaravan.getStatus(), is(notNullValue()));
            assertThat(updatedKaravan.getStatus().getState(), is(KaravanStatus.State.READY));
        });

        client.resource(new FileInputStream("src/test/resources/kubernetes/pipelines.yaml")).create();
        client.resource(new FileInputStream("src/test/resources/kubernetes/tasks.yaml")).create();

        await().atMost(5, MINUTES).ignoreExceptions().untilAsserted(() -> {
                    getTektonResources().forEach(c -> assertNotNull(client.resources(c.type).inNamespace(DEFAULT_NAMESPACE).withName(c.name).get()));
                });

        deleteKaravan(karavan);
        client.resource(new FileInputStream("src/test/resources/kubernetes/pipelines.yaml")).delete();
        client.resource(new FileInputStream("src/test/resources/kubernetes/tasks.yaml")).delete();
    }
}
