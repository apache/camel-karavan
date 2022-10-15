package org.apache.camel.karavan.operator.watcher;

import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import io.fabric8.openshift.api.model.operatorhub.v1alpha1.Subscription;
import org.apache.camel.karavan.operator.KaravanReconciler;

import java.util.List;

public class TektonSubscriptionWatcher implements Watcher<Subscription> {

    private KaravanReconciler karavanReconciler;

    public TektonSubscriptionWatcher(KaravanReconciler karavanReconciler) {
        this.karavanReconciler = karavanReconciler;
    }

    @Override
    public void eventReceived(Action action, Subscription resource) {
        if (List.of("ADDED").contains(action.name()) && resource.getMetadata().getName().contains("openshift-pipelines-operator")) {
            karavanReconciler.addTektonResources();
        }
    }

    @Override
    public void onClose(WatcherException cause) {

    }
}
