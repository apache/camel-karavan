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
package org.apache.camel.karavan.status;

import jakarta.enterprise.inject.Default;
import jakarta.inject.Singleton;
import org.apache.camel.karavan.status.model.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Default
@Singleton
public class StatusCache {

    private final Map<String, DeploymentStatus> deploymentStatuses = new ConcurrentHashMap<>();
    private final Map<String, ContainerStatus> containerStatuses = new ConcurrentHashMap<>();
    private final Map<String, Boolean> transits = new ConcurrentHashMap<>();
    private final Map<String, ServiceStatus> serviceStatuses = new ConcurrentHashMap<>();
    private final Map<String, CamelStatus> camelStatuses = new ConcurrentHashMap<>();

    public DeploymentStatus getDeploymentStatus(String projectId, String environment) {
        return deploymentStatuses.get(GroupedKey.create(projectId, environment, projectId));
    }

    public void saveDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()), status);
    }

    public void deleteDeploymentStatus(DeploymentStatus status) {
        deploymentStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()));
    }

    public List<DeploymentStatus> getDeploymentStatuses() {
        return new ArrayList<>(deploymentStatuses.values());
    }

    public List<DeploymentStatus> getDeploymentStatuses(String env) {
        return deploymentStatuses.values().stream().filter(pf -> Objects.equals(pf.getEnv(), env)).toList();
    }

    public void deleteAllDeploymentsStatuses() {
        deploymentStatuses.clear();
    }

    public void saveServiceStatus(ServiceStatus status) {
        serviceStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()), status);
    }

    public void deleteServiceStatus(ServiceStatus status) {
        serviceStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getProjectId()));
    }

    public List<ServiceStatus> getServiceStatuses() {
        return new ArrayList<>(serviceStatuses.values());
    }

    public List<Boolean> getTransits() {
        return new ArrayList<>(transits.values());
    }

    public Boolean getTransit(String projectId, String env, String containerName) {
        return transits.get(GroupedKey.create(projectId, env, containerName));
    }

    public void setTransit(String projectId, String env, String containerName) {
        transits.put(GroupedKey.create(projectId, env, containerName), true);
    }

    public List<ContainerStatus> getContainerStatuses() {
        return new ArrayList<>(containerStatuses.values());
    }

    public List<ContainerStatus> getContainerStatuses(String projectId, String env) {
        return containerStatuses.values().stream().filter(el -> Objects.equals(el.getProjectId(), projectId) && Objects.equals(el.getEnv(), env)).toList();
    }

    public ContainerStatus getContainerStatus(String projectId, String env, String containerName) {
        return getContainerStatus(GroupedKey.create(projectId, env, containerName));
    }

    public ContainerStatus getContainerStatus(String key) {
        return containerStatuses.get(key);
    }

    public ContainerStatus getDevModeContainerStatus(String projectId, String env) {
        return containerStatuses.get(GroupedKey.create(projectId, env, projectId));
    }

    public List<ContainerStatus> getContainerStatuses(String env) {
        return containerStatuses.values().stream().filter(el -> Objects.equals(el.getEnv(), env)).toList();
    }

    public List<ContainerStatus> getAllContainerStatuses() {
        return new ArrayList<>(containerStatuses.values());
    }

    public void saveContainerStatus(ContainerStatus status) {
        containerStatuses.put(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName()), status);
    }

    public void deleteContainerStatus(ContainerStatus status) {
        containerStatuses.remove(GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName()));
    }

    public void deleteAllContainersStatuses() {
        containerStatuses.clear();
    }

    public void deleteContainerStatus(String projectId, String env, String containerName) {
        containerStatuses.remove(GroupedKey.create(projectId, env, containerName));
    }

    public CamelStatus getCamelStatus(String projectId, String env, String containerName) {
        var key = GroupedKey.create(projectId, env, containerName);
        return camelStatuses.get(key);
    }

    public CamelStatus getCamelStatus(String key) {
        return camelStatuses.get(key);
    }

    public List<CamelStatus> getCamelStatusesByEnv(CamelStatusValue.Name name) {
        List<CamelStatus> copy = new ArrayList<>(camelStatuses.size());
        camelStatuses.values().forEach(camelStatus -> copy.add(camelStatus.clone()));
        return copy.stream().peek(cs -> {
            var values = cs.getStatuses();
            cs.setStatuses(values.stream().filter(v -> Objects.equals(v.getName(), name)).toList());
        }).toList();
    }

    public List<CamelStatus> getCamelStatusesByProjectAndEnv(String projectId, String env) {
        List<CamelStatus> copy = new ArrayList<>(camelStatuses.size());
        camelStatuses.values().forEach(camelStatus -> copy.add(camelStatus.clone()));
        return copy.stream().filter(el -> Objects.equals(el.getProjectId(), projectId) && Objects.equals(el.getEnv(), env)).toList();
    }

    public void saveCamelStatus(CamelStatus status) {
        var key = GroupedKey.create(status.getProjectId(), status.getEnv(), status.getContainerName());
        camelStatuses.put(key, status);
    }

    public void deleteCamelStatus(String projectId, String name, String env) {
        var key = GroupedKey.create(projectId, env, name);
        camelStatuses.remove(key);
    }

    public void deleteCamelStatuses(String projectId, String env) {
        camelStatuses.values().stream().filter(el -> Objects.equals(el.getProjectId(), projectId) && Objects.equals(el.getEnv(), env))
                .forEach(s -> {
                    var key = GroupedKey.create(projectId, env, s.getContainerName());
                    camelStatuses.remove(key);
                });
    }

    public void deleteAllCamelStatuses() {
        camelStatuses.clear();
    }

    public List<ContainerStatus> getLoadedDevModeStatuses() {
        return containerStatuses.values().stream().filter(el -> Objects.equals(el.getType(), ContainerStatus.ContainerType.devmode) && Objects.equals(el.getCodeLoaded(), true)).toList();
    }

    public List<ContainerStatus> getDevModeStatuses() {
        return containerStatuses.values().stream().filter(el -> Objects.equals(el.getType(), ContainerStatus.ContainerType.devmode)).toList();
    }

    public List<ContainerStatus> getContainerStatusByEnv(String env) {
        return containerStatuses.values().stream().filter(el -> Objects.equals(el.getEnv(), env)).toList();
    }

    public void clearAllStatuses() {
        deploymentStatuses.clear();
        containerStatuses.clear();
        camelStatuses.clear();
    }
}
