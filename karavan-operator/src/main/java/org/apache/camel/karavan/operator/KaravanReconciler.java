package org.apache.camel.karavan.operator;

import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.ControllerConfiguration;
import io.javaoperatorsdk.operator.api.reconciler.Reconciler;
import io.javaoperatorsdk.operator.api.reconciler.UpdateControl;
import io.javaoperatorsdk.operator.api.reconciler.dependent.Dependent;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import static io.javaoperatorsdk.operator.api.reconciler.Constants.WATCH_ALL_NAMESPACES;

@ControllerConfiguration(namespaces = WATCH_ALL_NAMESPACES, name = "camel-karavan-operator",
        dependents = {
                @Dependent(name = "sa", type = KaravanServiceAccount.class),
                @Dependent(name = "role", type = KaravanRole.class),
                @Dependent(name = "role-binding", type = KaravanRoleBinding.class, dependsOn = {"role", "sa"}),
                @Dependent(name = "role-binding-view", type = KaravanRoleBindingView.class),
                @Dependent(name = Constants.PVC_DATA, type = KaravanPvcData.class),
                @Dependent(name = Constants.PVC_M2_CACHE, type = KaravanPvcM2Cache.class),
                @Dependent(name = Constants.PVC_JBANG_CACHE, type = KaravanPvcJbang.class),
                @Dependent(name = Constants.TASK_BUILD_QUARKUS, type = KaravanTektonTask.class, dependsOn = {Constants.PVC_JBANG_CACHE, Constants.PVC_M2_CACHE}),
                @Dependent(name = Constants.PIPELINE_BUILD_QUARKUS, type = KaravanTektonPipeline.class, dependsOn = {Constants.TASK_BUILD_QUARKUS, Constants.PVC_JBANG_CACHE, Constants.PVC_M2_CACHE}),
                @Dependent(name = "deployment", type = KaravanDeployment.class, dependsOn = {Constants.PVC_DATA}),
                @Dependent(name = "service", type = KaravanService.class, dependsOn = "deployment"),
                @Dependent(type = KaravanRoute.class, dependsOn = "service", reconcilePrecondition = KaravanRoute.class)
        })
public class KaravanReconciler implements Reconciler<Karavan> {

    static final Logger log = LoggerFactory.getLogger(KaravanReconciler.class);

    @ConfigProperty(name = "karavan.version")
    String version;

    @Override
    public UpdateControl<Karavan> reconcile(Karavan karavan, Context<Karavan> context) throws Exception {
        final var name = karavan.getMetadata().getName();
        final var namespace = karavan.getMetadata().getNamespace();
        // retrieve the workflow reconciliation result and re-schedule if we have dependents that are not yet ready
        return context.managedDependentResourceContext().getWorkflowReconcileResult()
                .map(wrs -> {
                    if (wrs.allDependentResourcesReady()) {
                        log.info("Karavan is exposed and ready to be used at '{}' namespace", namespace);
                        karavan.setStatus(new KaravanStatus(KaravanStatus.State.READY));
                        return UpdateControl.updateStatus(karavan);
                    } else {
                        final var duration = Duration.ofSeconds(5);
                        log.info("Karavan is not ready yet, rescheduling reconciliation after {}s", name, duration.toSeconds());
                        return UpdateControl.<Karavan>noUpdate().rescheduleAfter(duration);
                    }
                }).orElseThrow();
    }

    protected Map<String, String> getLabels(String name, Map<String, String> labels) {
        Map<String, String> result = new HashMap<>(Map.of(
                "app", name,
                "app.kubernetes.io/name", name,
                "app.kubernetes.io/version", version,
                "app.kubernetes.io/part-of", Constants.NAME
        ));
        result.putAll(labels);
        return result;
    }
}

