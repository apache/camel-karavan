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

package org.apache.camel.karavan.kubernetes;

import io.fabric8.kubernetes.api.model.ContainerBuilder;
import io.fabric8.kubernetes.api.model.Pod;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirements;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import io.vertx.core.json.JsonObject;
import io.vertx.mutiny.core.eventbus.EventBus;
import org.apache.camel.karavan.model.PodContainerStatus;
import org.jboss.logging.Logger;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.apache.camel.karavan.KaravanConstants.*;
import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_DELETED;
import static org.apache.camel.karavan.KaravanEvents.POD_CONTAINER_UPDATED;

public class PodEventHandler implements ResourceEventHandler<Pod> {

    private static final Logger LOGGER = Logger.getLogger(PodEventHandler.class.getName());

    private final KubernetesStatusService kubernetesStatusService;
    private final EventBus eventBus;

    public static final Map<String, String> DEFAULT_CONTAINER_RESOURCES = Map.of(
            "requests.memory", "256Mi",
            "requests.cpu", "500m",
            "limits.memory", "2048Mi",
            "limits.cpu", "2000m"
    );

    public PodEventHandler(KubernetesStatusService kubernetesStatusService, EventBus eventBus) {
        this.kubernetesStatusService = kubernetesStatusService;
        this.eventBus = eventBus;
    }

    @Override
    public void onAdd(Pod pod) {
        try {
            LOGGER.info("onAdd " + pod.getMetadata().getName());
            PodContainerStatus ps = getPodStatus(pod);
            if (ps != null) {
                eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(ps));
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onUpdate(Pod oldPod, Pod newPod) {
        try {
            LOGGER.info("onUpdate " + newPod.getMetadata().getName());
            if (!newPod.isMarkedForDeletion() && newPod.getMetadata().getDeletionTimestamp() == null) {
                PodContainerStatus ps = getPodStatus(newPod);
                if (ps != null) {
                    eventBus.publish(POD_CONTAINER_UPDATED, JsonObject.mapFrom(ps));
                }
            }
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }

    @Override
    public void onDelete(Pod pod, boolean deletedFinalStateUnknown) {
        try {
            LOGGER.info("onDelete " + pod.getMetadata().getName());
            String deployment = pod.getMetadata().getLabels().get("app");
            String projectId = deployment != null ? deployment : pod.getMetadata().getLabels().get(LABEL_PROJECT_ID);

            PodContainerStatus cs = new PodContainerStatus();
            cs.setProjectId(projectId);
            cs.setContainerName(pod.getMetadata().getName());
            cs.setEnv(kubernetesStatusService.environment);

            eventBus.publish(POD_CONTAINER_DELETED, JsonObject.mapFrom(cs));
        } catch (Exception e) {
            LOGGER.error(e.getMessage(), e.getCause());
        }
    }


    public PodContainerStatus getPodStatus(Pod pod) {
        String deployment = pod.getMetadata().getLabels().get("app");
        String projectId = deployment != null ? deployment : pod.getMetadata().getLabels().get(LABEL_PROJECT_ID);
        String camel = deployment != null ? deployment : pod.getMetadata().getLabels().get(LABEL_KUBERNETES_RUNTIME);
        String runtime = deployment != null ? deployment : pod.getMetadata().getLabels().get(LABEL_CAMEL_RUNTIME);
        String type = pod.getMetadata().getLabels().get(LABEL_TYPE);
        String commit = pod.getMetadata().getAnnotations().get(ANNOTATION_COMMIT);
        PodContainerStatus.ContainerType containerType = deployment != null
                ? PodContainerStatus.ContainerType.project
                : (type != null ? PodContainerStatus.ContainerType.valueOf(type) : PodContainerStatus.ContainerType.unknown);
        try {
            boolean ready = pod.getStatus().getConditions().stream().anyMatch(c -> c.getType().equals("Ready") && c.getStatus().equals("True"));
            boolean running = Objects.equals(pod.getStatus().getPhase(), "Running");
            boolean failed = Objects.equals(pod.getStatus().getPhase(), "Failed");
            boolean succeeded = Objects.equals(pod.getStatus().getPhase(), "Succeeded");
            String creationTimestamp = pod.getMetadata().getCreationTimestamp();

            ResourceRequirements defaultRR = kubernetesStatusService.getResourceRequirements(DEFAULT_CONTAINER_RESOURCES);
            ResourceRequirements resourceRequirements = pod.getSpec().getContainers().stream().findFirst()
                    .orElse(new ContainerBuilder().withResources(defaultRR).build()).getResources();

            String requestMemory = resourceRequirements.getRequests().getOrDefault("memory", new Quantity()).toString();
            String requestCpu = resourceRequirements.getRequests().getOrDefault("cpu", new Quantity()).toString();
            String limitMemory = resourceRequirements.getLimits().getOrDefault("memory", new Quantity()).toString();
            String limitCpu = resourceRequirements.getLimits().getOrDefault("cpu", new Quantity()).toString();
            PodContainerStatus status = new PodContainerStatus(
                    pod.getMetadata().getName(),
                    List.of(PodContainerStatus.Command.delete),
                    projectId,
                    kubernetesStatusService.environment,
                    containerType,
                    requestMemory + " / " + limitMemory,
                    requestCpu + " / " + limitCpu,
                    creationTimestamp);
            status.setImage(pod.getSpec().getContainers().get(0).getImage());
            status.setCommit(commit);
            status.setContainerId(pod.getMetadata().getName());
            status.setPhase(pod.getStatus().getPhase());
            status.setPodIP(pod.getStatus().getPodIP());
            status.setCamelRuntime(runtime != null ? runtime : (camel != null ? CamelRuntime.CAMEL_MAIN.getValue() : ""));
            if (running) {
                status.setState(PodContainerStatus.State.running.name());
            } else if (failed) {
                status.setState(PodContainerStatus.State.dead.name());
            } else if (succeeded) {
                status.setState(PodContainerStatus.State.exited.name());
            } else {
                status.setState(PodContainerStatus.State.created.name());
            }
            return status;
        } catch (Exception ex) {
            ex.printStackTrace();
            LOGGER.error(ex.getMessage(), ex.getCause());
            return null;
        }
    }
}