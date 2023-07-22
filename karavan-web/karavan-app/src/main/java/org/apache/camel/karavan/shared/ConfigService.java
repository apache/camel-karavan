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
package org.apache.camel.karavan.shared;

import io.quarkus.runtime.StartupEvent;
import io.quarkus.runtime.configuration.ConfigUtils;
import io.quarkus.runtime.configuration.ProfileManager;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.event.Observes;
import java.util.List;
import java.util.Objects;

@ApplicationScoped
public class ConfigService {

    public static final String HEADLESS_MODE = "headless";

    @ConfigProperty(name = "karavan.version")
    String version;

    @ConfigProperty(name = "karavan.environment")
    String environment;

    @ConfigProperty(name = "karavan.environments")
    List<String> environments;

    @ConfigProperty(name = "karavan.default-runtime")
    String runtime;

    @ConfigProperty(name = "karavan.runtimes")
    List<String> runtimes;

    private Configuration configuration;

    void onStart(@Observes StartupEvent ev) {
        configuration = new Configuration(
                version,
                 inKubernetes() ? "kubernetes" : "docker",
                 environment,
                 environments,
                 runtime,
                 runtimes
        );
    }

    public Configuration getConfiguration() {
        return configuration;
    }

    public static boolean inKubernetes() {
        return Objects.nonNull(System.getenv("KUBERNETES_SERVICE_HOST"));
    }

    public static boolean isHeadless() {
        return ConfigUtils.isProfileActive(HEADLESS_MODE);
    }

    public static boolean isDevOrTest() {
        return ProfileManager.getLaunchMode().isDevOrTest();
    }
}