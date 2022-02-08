package org.apache.camel.karavan;

import javax.inject.Inject;

import io.fabric8.kubernetes.client.KubernetesClient;
import io.javaoperatorsdk.operator.api.Context;
import io.javaoperatorsdk.operator.api.Controller;
import io.javaoperatorsdk.operator.api.ResourceController;
import io.javaoperatorsdk.operator.api.UpdateControl;
import io.javaoperatorsdk.operator.processing.event.EventSourceManager;

@Controller(namespaces = Controller.WATCH_CURRENT_NAMESPACE)
public class KaravanController implements ResourceController<Karavan> {

    @Inject
    KaravanResources karavanResources;

    @Inject
    KubernetesClient client;

    public KaravanController(KubernetesClient client) {
        this.client = client;
    }

    @Override
    public void init(EventSourceManager eventSourceManager) {
    }

    @Override
    public UpdateControl<Karavan> createOrUpdateResource(Karavan resource, Context<Karavan> context) {
        karavanResources.createResources(resource);

        resource.setStatus(new KaravanStatus());

        return UpdateControl.updateStatusSubResource(resource);
    }
}

