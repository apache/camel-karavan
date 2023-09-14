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
package org.apache.camel.karavan.installer;

import io.fabric8.kubernetes.client.utils.Serialization;
import org.apache.camel.karavan.installer.resources.*;

import java.util.*;

public class ResourceUtils {

    public static String generateResources(KaravanCommand config) {
        return String.join("", generateResourcesMap(config).values());
    }

    public static Map<String, String> generateResourcesMap(KaravanCommand config) {
        Map<String, String> result = new HashMap<>();

        result.put("sa-karavan", toYAML(KaravanServiceAccount.getServiceAccount(config)));

        result.put("role-karavan", toYAML(KaravanRole.getRole(config)));
        result.put("rb-karavan", toYAML(KaravanRole.getRoleBinding(config)));
        result.put("rb-karavan-view", toYAML(KaravanRole.getRoleBindingView(config)));

        result.put("deployment", toYAML(KaravanDeployment.getDeployment(config)));
        result.put("service", toYAML(KaravanService.getService(config)));

        if (config.isOpenShift()) {
            result.put("route", toYAML(KaravanService.getRoute(config)));
        }
        return result;
    }

    public static String toYAML(Object resource) {
        try {
            return Serialization.yamlMapper().writeValueAsString(resource);
        } catch (Exception e) {
            System.out.println(e.getMessage());
            return null;
        }
    }

    public static Map<String, String> getLabels(String name, String version, Map<String, String> labels) {
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
