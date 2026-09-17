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

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * {@code deploy.resources} of the Compose Specification.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DockerResourcesDefinition {

    private DockerResourceSpecDefinition limits;
    private DockerResourceSpecDefinition reservations;

    public DockerResourcesDefinition() {
    }

    public DockerResourcesDefinition(DockerResourceSpecDefinition limits, DockerResourceSpecDefinition reservations) {
        this.limits = limits;
        this.reservations = reservations;
    }

    public DockerResourceSpecDefinition getLimits() {
        return limits;
    }

    public void setLimits(DockerResourceSpecDefinition limits) {
        this.limits = limits;
    }

    public DockerResourceSpecDefinition getReservations() {
        return reservations;
    }

    public void setReservations(DockerResourceSpecDefinition reservations) {
        this.reservations = reservations;
    }

    @Override
    public String toString() {
        return "DockerResourcesDefinition {" +
                "limits=" + limits +
                ", reservations=" + reservations +
                '}';
    }
}
