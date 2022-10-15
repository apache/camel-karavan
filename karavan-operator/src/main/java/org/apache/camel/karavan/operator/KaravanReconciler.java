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

import io.fabric8.kubernetes.api.model.apiextensions.v1.CustomResourceDefinition;
import io.fabric8.kubernetes.api.model.apiextensions.v1.CustomResourceDefinitionList;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.Watch;
import io.fabric8.openshift.client.OpenShiftClient;
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
import io.javaoperatorsdk.operator.processing.dependent.workflow.builder.WorkflowBuilder;
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
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.spec.KaravanStatus;
import org.apache.camel.karavan.operator.watcher.TektonCrdWatcher;
import org.apache.camel.karavan.operator.watcher.TektonSubscriptionWatcher;
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

    private boolean isOpenShift = false;
    private boolean isTektonInstalled = false;
    private KubernetesClient client;
    private Watch watcher;
    private Workflow<Karavan> workflow;

    private KaravanServiceAccount karavanServiceAccount;
    private KaravanRole karavanRole;
    private KaravanRoleBinding karavanRoleBinding;
    private KaravanRoleBindingView karavanRoleBindingView;
    private KaravanPvcData karavanPvcData;
    private KaravanPvcM2Cache karavanPvcM2Cache;
    private KaravanPvcJbang karavanPvcJbang;
    private KaravanTektonTask karavanTektonTask;
    private KaravanTektonPipeline karavanTektonPipeline;
    private KaravanDeployment karavanDeployment;
    private KaravanService karavanService;
    private KaravanRoute karavanRoute;

    public KaravanReconciler(KubernetesClient client) {
        this.client = client;
        checkKubernetes();
        checkTektonInstalled();
        addSubscriptionWatcher();
        initDependentResources();
        createWorkflow();
        System.out.println("isTektonInstalled = " + isTektonInstalled);
    }

    @Override
    public UpdateControl<Karavan> reconcile(Karavan karavan, Context<Karavan> context) throws Exception {
        final var name = karavan.getMetadata().getName();
        final var namespace = karavan.getMetadata().getNamespace();
        WorkflowReconcileResult result = workflow.reconcile(karavan, context);
        if (result.allDependentResourcesReady()) {
            log.info("Karavan is exposed and ready to be used at '{}' namespace", namespace);
            karavan.setStatus(new KaravanStatus(KaravanStatus.State.READY));
            return UpdateControl.updateStatus(karavan);
        } else {
            final var duration = Duration.ofSeconds(5);
            log.info("Karavan is not ready yet, rescheduling reconciliation after {}s", name, duration.toSeconds());
            return UpdateControl.<Karavan>noUpdate().rescheduleAfter(duration);
        }
    }

    private void addSubscriptionWatcher() {
        if (this.isOpenShift) {
            this.watcher = client.adapt(OpenShiftClient.class).operatorHub().subscriptions().watch(new TektonSubscriptionWatcher(this));
        } else {
            this.watcher = client.apiextensions().v1().customResourceDefinitions().watch(new TektonCrdWatcher(this));
        }
    }
    private void checkKubernetes() {
        if (client.isAdaptable(OpenShiftClient.class)) {
            this.isOpenShift = true;
        }
    }

    private void checkTektonInstalled() {
        CustomResourceDefinitionList list = client.apiextensions().v1().customResourceDefinitions().list();
        if (list != null) {
            List<CustomResourceDefinition> items = list.getItems();
            long crds = items.stream().filter(crd -> crd.getMetadata().getName().equalsIgnoreCase("pipelines.tekton.dev")
                    || crd.getMetadata().getName().equalsIgnoreCase("tasks.tekton.dev")
            ).count();
            if (crds == 2) {
                if (this.isOpenShift) {
                    long oper = client.adapt(OpenShiftClient.class).operatorHub().subscriptions().list().getItems().stream()
                            .filter(sub -> sub.getMetadata().getName().contains("openshift-pipelines-operator")).count();
                    this.isTektonInstalled = oper > 0;
                } else {
                    this.isTektonInstalled = true;
                }
            }
        }
    }

    private void createWorkflow() {
        WorkflowBuilder workflowBuilder = new WorkflowBuilder<Karavan>();
        workflowBuilder.addDependentResource(karavanServiceAccount);
        workflowBuilder.addDependentResource(karavanRole);
        workflowBuilder.addDependentResource(karavanRoleBinding);
        workflowBuilder.addDependentResource(karavanRoleBindingView);
        workflowBuilder.addDependentResource(karavanPvcData);
        workflowBuilder.addDependentResource(karavanPvcM2Cache);
        workflowBuilder.addDependentResource(karavanPvcJbang);
        workflowBuilder.addDependentResource(karavanDeployment);
        workflowBuilder.addDependentResource(karavanService);
        if (isOpenShift){
            workflowBuilder.addDependentResource(karavanRoute);
        }
        if (isTektonInstalled){
            workflowBuilder.addDependentResource(karavanTektonPipeline);
            workflowBuilder.addDependentResource(karavanTektonTask);
        }
        this.workflow = workflowBuilder.build();
    }

    private void initDependentResources() {
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
        if (isTektonInstalled) {
            this.karavanTektonTask = new KaravanTektonTask();
            this.karavanTektonPipeline = new KaravanTektonPipeline();
        }
        getResources().forEach(dr -> {
            dr.setKubernetesClient(client);
            dr.configureWith(new KubernetesDependentResourceConfig());
        });
    }

    public void addTektonResources() {
        isTektonInstalled = true;
        if (karavanTektonTask == null) {
            karavanTektonTask = new KaravanTektonTask();
            karavanTektonTask.setKubernetesClient(client);
            karavanTektonTask.configureWith(new KubernetesDependentResourceConfig());
        }
        if (karavanTektonPipeline == null) {
            karavanTektonPipeline = new KaravanTektonPipeline();
            karavanTektonPipeline.setKubernetesClient(client);
            karavanTektonPipeline.configureWith(new KubernetesDependentResourceConfig());
        }
        createWorkflow();
    }

    @Override
    public Map<String, EventSource> prepareEventSources(EventSourceContext<Karavan> context) {
        List<EventSource> list = getResources().stream().map(crd -> crd.initEventSource(context)).collect(Collectors.toList());
        return EventSourceInitializer.nameEventSources(list.toArray(new EventSource[list.size()]));
    }

    private List<CRUDKubernetesDependentResource> getResources(){
        List<CRUDKubernetesDependentResource> list = new ArrayList<>(Arrays.asList(
                karavanServiceAccount, karavanRole, karavanRoleBinding, karavanRoleBindingView,
                karavanPvcData, karavanPvcM2Cache, karavanPvcJbang,
                karavanDeployment, karavanService
        ));
        if (isOpenShift) {
            list.add(karavanRoute);
        }
        if (isTektonInstalled) {
            list.add(karavanTektonPipeline);
            list.add(karavanTektonTask);
        }
        return list;
    }
}

