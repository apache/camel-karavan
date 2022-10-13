package org.apache.camel.karavan;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.ContextInitializer;
import io.javaoperatorsdk.operator.api.reconciler.ControllerConfiguration;
import io.javaoperatorsdk.operator.api.reconciler.Reconciler;
import io.javaoperatorsdk.operator.api.reconciler.UpdateControl;
import io.javaoperatorsdk.operator.api.reconciler.dependent.Dependent;

import java.util.HashMap;
import java.util.Map;

import static io.javaoperatorsdk.operator.api.reconciler.Constants.WATCH_ALL_NAMESPACES;

@ControllerConfiguration(namespaces = WATCH_ALL_NAMESPACES, name = "karavan", dependents = {
        @Dependent(type = KaravanServiceAccount.class),
        @Dependent(type = KaravanRole.class),
        @Dependent(type = KaravanRoleBinding.class),
        @Dependent(type = KaravanRoleBindingView.class),
        @Dependent(type = KaravanPvcData.class, name = Constants.PVC_DATA),
        @Dependent(type = KaravanPvcM2Cache.class, name = Constants.PVC_M2_CACHE),
        @Dependent(type = KaravanPvcJbang.class, name = Constants.PVC_JBANG),
        @Dependent(type = KaravanTektonTask.class),
        @Dependent(type = KaravanTektonPipeline.class),
        @Dependent(type = KaravanDeployment.class),
        @Dependent(name = "service", type = KaravanService.class),
//        @Dependent(type = IngressDependent.class, dependsOn = "service", readyPostcondition = IngressDependent.class)
})
public class KaravanReconciler implements Reconciler<Karavan>, ContextInitializer<Karavan> {

    static final Logger log = LoggerFactory.getLogger(KaravanReconciler.class);

    @ConfigProperty(name = "karavan.version")
    String version;

    @Override
    public void initContext(Karavan karavan, Context<Karavan> context) {

    }

    @Override
    public UpdateControl<Karavan> reconcile(Karavan karavan, Context<Karavan> context) throws Exception {
        final var name = karavan.getMetadata().getName();
        final var namespace = karavan.getMetadata().getNamespace();
        // retrieve the workflow reconciliation result and re-schedule if we have dependents that are not yet ready
//        return context.managedDependentResourceContext().getWorkflowReconcileResult()
//                .map(wrs -> {
//                    if (wrs.allDependentResourcesReady()) {
////                        final var url = IngressDependent.getExposedURL(
////                                context.getSecondaryResource(Ingress.class).orElseThrow());
//                        log.info("App {} is exposed and ready to be used at {}", name, namespace);
                        karavan.setStatus(new KaravanStatus(KaravanStatus.State.READY));
                        return UpdateControl.updateStatus(karavan);
//                    } else {
//                        final var duration = Duration.ofSeconds(5);
//                        log.info("App {} is not ready yet, rescheduling reconciliation after {}s", name, duration.toSeconds());
//                        return UpdateControl.<Karavan> noUpdate().rescheduleAfter(duration);
//                    }
//                }).orElseThrow();
    }

    protected Map<String, String> getLabels(String name, Map<String, String> labels) {
        Map<String, String> result = new HashMap<>(Map.of(
                "app", name,
                "app.kubernetes.io/name", name,
                "app.kubernetes.io/version", version,
                "app.kubernetes.io/part-of",  Constants.NAME
        ));
        result.putAll(labels);
        return result;
    }
}

