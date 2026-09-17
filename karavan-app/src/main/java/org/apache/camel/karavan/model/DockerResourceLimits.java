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

package org.apache.camel.karavan.model;

/**
 * CPU and memory limits/reservations of a container, flattened out of
 * {@code deploy.resources} of the Compose Specification. Values are kept as the raw
 * Compose strings ("1.5", "512m", ...) and converted to the units the Docker Daemon
 * expects when the HostConfig is built.
 */
public record DockerResourceLimits(String cpuLimit, String memLimit, String pidsLimit,
                                   String cpuReservation, String memReservation) {

    public static final DockerResourceLimits NONE = new DockerResourceLimits(null, null, null, null, null);

    public static DockerResourceLimits from(DockerComposeService compose) {
        var resources = compose != null && compose.getDeploy() != null ? compose.getDeploy().getResources() : null;
        if (resources == null) {
            return NONE;
        }
        var limits = resources.getLimits();
        var reservations = resources.getReservations();
        return new DockerResourceLimits(
                limits != null ? limits.getCpus() : null,
                limits != null ? limits.getMemory() : null,
                limits != null ? limits.getPids() : null,
                reservations != null ? reservations.getCpus() : null,
                reservations != null ? reservations.getMemory() : null);
    }
}
