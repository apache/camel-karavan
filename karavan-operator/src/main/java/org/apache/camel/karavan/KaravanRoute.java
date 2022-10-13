package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.client.DefaultKubernetesClient;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.openshift.api.model.Route;
import io.fabric8.openshift.api.model.RouteBuilder;
import io.fabric8.openshift.api.model.RoutePort;
import io.fabric8.openshift.api.model.RouteTargetReferenceBuilder;
import io.fabric8.openshift.client.OpenShiftClient;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import io.javaoperatorsdk.operator.processing.dependent.workflow.Condition;

import javax.inject.Inject;
import java.util.Map;

public class KaravanRoute extends CRUDKubernetesDependentResource<Route, Karavan> implements Condition<Route, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanRoute() {
        super(Route.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Route desired(Karavan karavan, Context<Karavan> context) {
        return new RouteBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.NAME, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withPort(new RoutePort(new IntOrString(8080)))
                .withTo(new RouteTargetReferenceBuilder().withKind("Service").withName(Constants.NAME).build())
                .endSpec()
                .build();
    }

    @Override
    public boolean isMet(Karavan karavan, Route route, Context<Karavan> context) {
        KubernetesClient kubernetesClient = new DefaultKubernetesClient();
        return kubernetesClient.isAdaptable(OpenShiftClient.class);
    }
}
