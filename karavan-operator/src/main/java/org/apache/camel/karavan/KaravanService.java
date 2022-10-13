package org.apache.camel.karavan;

import io.fabric8.kubernetes.api.model.IntOrString;
import io.fabric8.kubernetes.api.model.Service;
import io.fabric8.kubernetes.api.model.ServiceBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;

import javax.inject.Inject;
import java.util.Map;


public class KaravanService extends CRUDKubernetesDependentResource<Service, Karavan> {

    @Inject
    KaravanReconciler karavanReconciler;

    public KaravanService() {
        super(Service.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Service desired(Karavan karavan, Context<Karavan> context) {
        return new ServiceBuilder()
                .withNewMetadata()
                .withName(Constants.NAME)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(karavanReconciler.getLabels(Constants.NAME, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withType("NodePort")
                .addNewPort()
                .withName(Constants.NAME)
                .withPort(80)
                .withTargetPort(new IntOrString(8080))
                .withNodePort(karavan.getSpec().getNodePort())
                .withProtocol("TCP")
                .endPort()
                .withSelector(Map.of("app", Constants.NAME))
                .endSpec()
                .build();
    }
}
