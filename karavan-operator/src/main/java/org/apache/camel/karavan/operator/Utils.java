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

import io.fabric8.kubernetes.api.model.APIResourceList;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.openshift.client.OpenShiftClient;
import io.fabric8.tekton.pipeline.v1beta1.Pipeline;
import io.fabric8.tekton.pipeline.v1beta1.Task;
import org.eclipse.microprofile.config.ConfigProvider;

import java.util.HashMap;
import java.util.Map;

public class Utils {

    public static Map<String, String> getLabels(String name, Map<String, String> labels) {
        Map<String, String> result = new HashMap<>(Map.of(
                "app", name,
                "app.kubernetes.io/name", name,
                "app.kubernetes.io/version", ConfigProvider.getConfig().getValue("karavan.version", String.class),
                "app.kubernetes.io/part-of", Constants.NAME
        ));
        result.putAll(labels);
        return result;
    }

    public static boolean isTektonInstalled(KubernetesClient client) {
        Pipeline pipeline = new Pipeline();
        Task task = new Task();
        APIResourceList kinds = client.getApiResources(pipeline.getApiVersion());
        if (kinds != null && kinds.getResources().stream().filter(res -> res.getKind().equalsIgnoreCase(pipeline.getKind())).findAny().isPresent() &&
                kinds.getResources().stream().filter(res -> res.getKind().equalsIgnoreCase(task.getKind())).findAny().isPresent()) {
            if (isOpenShift(client)) {
                long oper = client.adapt(OpenShiftClient.class).operatorHub().subscriptions().list().getItems().stream()
                        .filter(sub -> sub.getMetadata().getName().contains("openshift-pipelines-operator")).count();
                return oper > 0;
            } else {
                return true;
            }
        }
        return false;
    }

    public static boolean isOpenShift(KubernetesClient client) {
        if (client.isAdaptable(OpenShiftClient.class)) {
            return true;
        }
        return false;
    }
}
