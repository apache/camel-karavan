package org.apache.camel.karavan.operator.watcher;

import io.fabric8.kubernetes.api.model.apiextensions.v1.CustomResourceDefinition;
import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import org.apache.camel.karavan.operator.KaravanReconciler;

import java.util.List;

public class TektonCrdWatcher implements Watcher<CustomResourceDefinition> {

    private KaravanReconciler karavanReconciler;

    public TektonCrdWatcher(KaravanReconciler karavanReconciler) {
        this.karavanReconciler = karavanReconciler;
    }

    @Override
    public void eventReceived(Action action, CustomResourceDefinition resource) {
        if (List.of("MODIFIED", "ADDED").contains(action.name())) {
            if (List.of("ADDED").contains(action.name()) && resource.getMetadata().getName().contains("pipelines.tekton.dev")) {
                karavanReconciler.addTektonResources();
            }
        }
    }

    @Override
    public void onClose(WatcherException cause) {

    }
}
