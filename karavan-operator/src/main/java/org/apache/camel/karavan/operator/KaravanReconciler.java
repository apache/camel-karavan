/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.apache.camel.karavan.operator;

import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.openshift.client.OpenShiftClient;
import io.fabric8.tekton.pipeline.v1beta1.Pipeline;
import io.fabric8.tekton.pipeline.v1beta1.Task;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.ControllerConfiguration;
import io.javaoperatorsdk.operator.api.reconciler.EventSourceContext;
import io.javaoperatorsdk.operator.api.reconciler.EventSourceInitializer;
import io.javaoperatorsdk.operator.api.reconciler.Reconciler;
import io.javaoperatorsdk.operator.api.reconciler.UpdateControl;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.KubernetesDependentResourceConfig;
import io.javaoperatorsdk.operator.processing.dependent.workflow.Workflow;
import io.javaoperatorsdk.operator.processing.dependent.workflow.WorkflowReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.workflow.WorkflowBuilder;
import io.javaoperatorsdk.operator.processing.event.source.EventSource;
import org.apache.camel.karavan.operator.resource.KaravanDeployment;
import org.apache.camel.karavan.operator.resource.KaravanPvcData;
import org.apache.camel.karavan.operator.resource.KaravanPvcJbang;
import org.apache.camel.karavan.operator.resource.KaravanPvcM2Cache;
import org.apache.camel.karavan.operator.resource.KaravanRole;
import org.apache.camel.karavan.operator.resource.KaravanRoleBinding;
import org.apache.camel.karavan.operator.resource.KaravanRoleBindingView;
import org.apache.camel.karavan.operator.resource.KaravanRoute;
import org.apache.camel.karavan.operator.resource.KaravanService;
import org.apache.camel.karavan.operator.resource.KaravanServiceAccount;
import org.apache.camel.karavan.operator.resource.KaravanTektonPipeline;
import org.apache.camel.karavan.operator.resource.KaravanTektonTask;
import org.apache.camel.karavan.operator.resource.PipelineRoleBinding;
import org.apache.camel.karavan.operator.resource.PipelineRoleDeployer;
import org.apache.camel.karavan.operator.resource.PipelineServiceAccount;
import org.apache.camel.karavan.operator.spec.CamelRuntime;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.spec.KaravanStatus;
import org.apache.camel.karavan.operator.watcher.TektonCrdEventHandler;
import org.apache.camel.karavan.operator.watcher.TektonSubscriptionEventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static io.javaoperatorsdk.operator.api.reconciler.Constants.WATCH_ALL_NAMESPACES;

@ControllerConfiguration(namespaces = WATCH_ALL_NAMESPACES, name = "camel-karavan-operator")
public class KaravanReconciler implements Reconciler<Karavan>, EventSourceInitializer<Karavan> {

    static final Logger log = LoggerFactory.getLogger(KaravanReconciler.class);

    private boolean isOpenShift;
    private final boolean initTektonInstalled;
    private KubernetesClient client;
    private Workflow<Karavan> workflow;
    private KaravanServiceAccount karavanServiceAccount;
    private KaravanRole karavanRole;
    private KaravanRoleBinding karavanRoleBinding;
    private KaravanRoleBindingView karavanRoleBindingView;
    private KaravanPvcData karavanPvcData;
    private KaravanPvcM2Cache karavanPvcM2Cache;
    private KaravanPvcJbang karavanPvcJbang;
    private KaravanService karavanService;
    private KaravanRoute karavanRoute;
    private KaravanDeployment karavanDeployment;

    private KaravanTektonPipeline karavanTektonPipelineQuarkus;
    private KaravanTektonPipeline karavanTektonPipelineSpringboot;
    private KaravanTektonTask karavanTektonTaskQuarkus;
    private KaravanTektonTask karavanTektonTaskSpringBoot;
    private PipelineServiceAccount pipelineServiceAccount;
    private PipelineRoleDeployer pipelineRoleDeployer;
    private PipelineRoleBinding pipelineRoleBinding;

    public KaravanReconciler(KubernetesClient client) {
        this.client = client;
        this.isOpenShift = Utils.isOpenShift(client);
        this.initTektonInstalled = Utils.isTektonInstalled(client);
        initDependentResources();
        createWorkflow();
        addSubscriptionWatcher();
    }

    @Override
    public UpdateControl<Karavan> reconcile(Karavan karavan, Context<Karavan> context) throws Exception {
        final var name = karavan.getMetadata().getName();
        final var namespace = karavan.getMetadata().getNamespace();
        log.info("--- Starting Karavan '{}' reconcile at '{}' namespace ---", name, namespace);

        WorkflowReconcileResult result = workflow.reconcile(karavan, context);
        if (result.allDependentResourcesReady()) {
            log.info("Karavan '{}' is exposed and ready to be used at '{}' namespace", name, namespace);
            karavan.setStatus(new KaravanStatus(KaravanStatus.State.READY));
            return UpdateControl.updateStatus(karavan);
        } else {
            final var duration = Duration.ofSeconds(5);
            log.info("Karavan '{}' is not ready yet, rescheduling reconciliation after {}s", name, duration.toSeconds());
            return UpdateControl.<Karavan>noUpdate().rescheduleAfter(duration);
        }
    }

    private void addSubscriptionWatcher() {
        if (this.isOpenShift) {
            client.adapt(OpenShiftClient.class).operatorHub().subscriptions().inform(new TektonSubscriptionEventHandler(initTektonInstalled), 30 * 1000L);
        }
        client.apiextensions().v1().customResourceDefinitions().inform(new TektonCrdEventHandler(Pipeline::new, initTektonInstalled), 30 * 1000L);
        client.apiextensions().v1().customResourceDefinitions().inform(new TektonCrdEventHandler(Task::new, initTektonInstalled), 30 * 1000L);
    }

    private void createWorkflow() {
        log.info("Creating workflow in " + (isOpenShift ? "Openshift" : "Kubernetes"));
        WorkflowBuilder workflowBuilder = new WorkflowBuilder<Karavan>();
        getResources().forEach(workflowBuilder::addDependentResource);
        this.workflow = workflowBuilder.build();
    }

    private void initDependentResources() {
        log.info("Init Dependent Resources");
        this.karavanServiceAccount = new KaravanServiceAccount();
        this.karavanRole = new KaravanRole();
        this.karavanRoleBinding = new KaravanRoleBinding();
        this.karavanRoleBindingView = new KaravanRoleBindingView();
        this.karavanPvcData = new KaravanPvcData();
        this.karavanPvcM2Cache = new KaravanPvcM2Cache();
        this.karavanPvcJbang = new KaravanPvcJbang();
        this.karavanDeployment = new KaravanDeployment();
        this.karavanService = new KaravanService();

        if (isOpenShift) {
            this.karavanRoute = new KaravanRoute();
        }

        if (Utils.isTektonInstalled(client)) {
            log.info("Init Tekton Dependent Resources");
            this.karavanTektonTaskQuarkus = new KaravanTektonTask(isOpenShift, CamelRuntime.Type.QUARKUS);
            this.karavanTektonTaskSpringBoot = new KaravanTektonTask(isOpenShift, CamelRuntime.Type.SPRING_BOOT);
            this.karavanTektonPipelineQuarkus = new KaravanTektonPipeline(CamelRuntime.Type.QUARKUS);
            this.karavanTektonPipelineSpringboot = new KaravanTektonPipeline(CamelRuntime.Type.SPRING_BOOT);
            this.pipelineServiceAccount = new PipelineServiceAccount();
            this.pipelineRoleDeployer = new PipelineRoleDeployer();
            this.pipelineRoleBinding = new PipelineRoleBinding();
        }
        getResources().forEach(dr -> {
            dr.setKubernetesClient(client);
            dr.configureWith(new KubernetesDependentResourceConfig());
        });
    }

    @Override
    public Map<String, EventSource> prepareEventSources(EventSourceContext<Karavan> context) {
        List<EventSource> list = getResources().stream().map(crd -> crd.initEventSource(context)).collect(Collectors.toList());
        return EventSourceInitializer.nameEventSources(list.toArray(new EventSource[list.size()]));
    }

    private List<CRUDKubernetesDependentResource> getResources() {
        List<CRUDKubernetesDependentResource> list = new ArrayList<>(Arrays.asList(
                karavanServiceAccount, karavanRole, karavanRoleBinding, karavanRoleBindingView,
                karavanPvcData, karavanPvcM2Cache, karavanPvcJbang,
                karavanDeployment, karavanService
        ));
        if (isOpenShift) {
            list.add(karavanRoute);
        }
        if (Utils.isTektonInstalled(client)) {
            list.add(karavanTektonPipelineQuarkus);
            list.add(karavanTektonPipelineSpringboot);
            list.add(karavanTektonTaskQuarkus);
            list.add(karavanTektonTaskSpringBoot);
            list.add(pipelineServiceAccount);
            list.add(pipelineRoleDeployer);
            list.add(pipelineRoleBinding);
        }
        return list;
    }
}

