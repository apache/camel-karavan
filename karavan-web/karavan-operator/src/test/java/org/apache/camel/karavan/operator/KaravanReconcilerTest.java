package org.apache.camel.karavan.operator;

import io.fabric8.kubernetes.api.model.Namespace;
import io.fabric8.kubernetes.api.model.NamespaceBuilder;
import io.fabric8.kubernetes.api.model.ObjectMetaBuilder;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClientBuilder;
import io.javaoperatorsdk.operator.Operator;
import io.quarkus.test.junit.QuarkusTest;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.spec.KaravanSpec;
import org.apache.camel.karavan.operator.spec.KaravanStatus;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import javax.inject.Inject;

import static org.awaitility.Awaitility.await;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.CoreMatchers.is;
import static java.util.concurrent.TimeUnit.MINUTES;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.junit.jupiter.api.Assertions.assertNull;

@QuarkusTest
public class KaravanReconcilerTest {
    private static final String KARAVAN_OPERATOR_TEST_NAMESPACE = "karavan-operator-test";

    @Inject
    Operator operator;

    @Inject
    KubernetesClient client;

    @BeforeAll
    static void initNamespace() {
        new KubernetesClientBuilder().build().resource(new NamespaceBuilder().withNewMetadata().withName(KARAVAN_OPERATOR_TEST_NAMESPACE).endMetadata().build()).create();
    }

    @AfterAll
    static void cleanupNamespace() {
        var client = new KubernetesClientBuilder().build();
        client.resources(Namespace.class).withName(KARAVAN_OPERATOR_TEST_NAMESPACE).delete();
        await().atMost(5, MINUTES).ignoreExceptions().untilAsserted(() -> assertNull(client.resources(Namespace.class).withName(KARAVAN_OPERATOR_TEST_NAMESPACE).get()));
    }

    @Test
    void basicReconcile() {
        var karavan = new Karavan();
        karavan.setMetadata(new ObjectMetaBuilder().withName("karavan").withNamespace(KARAVAN_OPERATOR_TEST_NAMESPACE).build());
        karavan.setSpec(new KaravanSpec(1, "public", "demo", "quarkus,spring-boot", 30668, "10s"));

        operator.start();
        client.resource(karavan).create();

        await().atMost(5, MINUTES).ignoreExceptions().untilAsserted(() -> {
            Karavan updatedKaravan = client.resources(Karavan.class).inNamespace(KARAVAN_OPERATOR_TEST_NAMESPACE).withName("karavan").get();
            assertThat(updatedKaravan.getStatus(), is(notNullValue()));
            assertThat(updatedKaravan.getStatus().getState(), is(KaravanStatus.State.READY));
        });

        operator.stop();
    }
}
