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
package org.apache.camel.karavan.service;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.apache.camel.karavan.shared.Configuration;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;

@ApplicationScoped
public class ConfigService {

    @ConfigProperty(name = "karavan.title")
    String title;

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @ConfigProperty(name = "karavan.environments")
    List<String> environments;


    private Configuration configuration;
    private static Boolean inKubernetes;
    private static Boolean inDocker;

    void onStart(@Observes StartupEvent ev) {
        configuration = new Configuration(
                title,
                version,
                inKubernetes() ? "kubernetes" : "docker",
                environment,
                environments
        );
    }

    public Configuration getConfiguration() {
        return configuration;
    }

    public static boolean inKubernetes() {
        if (inKubernetes == null) {
            inKubernetes = Objects.nonNull(System.getenv("KUBERNETES_SERVICE_HOST"));
        }
        return inKubernetes;
    }

    public static boolean inDocker() {
        if (inDocker == null) {
            inDocker = !inKubernetes() && Files.exists(Paths.get(".dockerenv"));
        }
        return inDocker;
    }

}