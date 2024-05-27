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
package org.apache.camel.karavan.manager.docker;

import com.github.dockerjava.api.model.*;
import org.apache.camel.karavan.project.model.DockerComposeHealthCheck;

import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;

public class DockerUtils {

    private static final Map<String, Long> UNIT_MULTIPLIERS = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);;
    static {
        UNIT_MULTIPLIERS.put("b", 1L);
        UNIT_MULTIPLIERS.put("k", 1024L);
        UNIT_MULTIPLIERS.put("m", 1024L * 1024);
        UNIT_MULTIPLIERS.put("g", 1024L * 1024 * 1024);
        // Add more units if needed
    }

    static Long parseMemory(String memory) {

        if (memory != null && !memory.isEmpty()) {
            memory = memory.trim();
            String numericPart = memory.replaceAll("[^\\d.]", "");
            double numericValue = Double.parseDouble(numericPart);
            String unitPart = memory.replaceAll("[\\d.]", "").toLowerCase();
            Long multiplier = UNIT_MULTIPLIERS.get(unitPart);
            if (multiplier == null) {
                throw new IllegalArgumentException("Invalid unit in memory: " + unitPart);
            }
            return (long) (numericValue * multiplier);
        }
        return null;
    }

    static HealthCheck getHealthCheck(DockerComposeHealthCheck config) {
        if (config != null) {
            HealthCheck healthCheck = new HealthCheck().withTest(config.getTest());
            if (config.getInterval() != null) {
                healthCheck.withInterval(durationNanos(config.getInterval()));
            }
            if (config.getTimeout() != null) {
                healthCheck.withTimeout(durationNanos(config.getTimeout()));
            }
            if (config.getStart_period() != null) {
                healthCheck.withStartPeriod(durationNanos(config.getStart_period()));
            }
            if (config.getRetries() != null) {
                healthCheck.withRetries(config.getRetries());
            }
            return healthCheck;
        }
        return new HealthCheck();
    }

     static long durationNanos(String s) {
        if (Pattern.compile("\\d+d\\s").matcher(s).find()) {
            int idxSpace = s.indexOf(" ");
            s = "P" + s.substring(0, idxSpace) + "T" + s.substring(idxSpace + 1);
        } else
            s = "PT" + s;
        s = s.replace(" ", "");
        return Duration.parse(s).toMillis() * 1000000L;
    }

    static Ports getPortBindings(Map<Integer, Integer> ports) {
        Ports portBindings = new Ports();

        ports.forEach((hostPort, containerPort) -> {
            Ports.Binding binding = Ports.Binding.bindPort(hostPort);
            portBindings.bind(ExposedPort.tcp(containerPort), binding);
        });
        return portBindings;
    }
}
