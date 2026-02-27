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
import {useSystemStore} from "@stores/SystemStore";
import {SystemApi} from "@api/SystemApi";
import {KubernetesConfigMap, KubernetesSecret} from "@models/SystemModels";

export class SystemService {

    public static refresh() {
        SystemApi.getSecrets((secrets: KubernetesSecret[]) => {
            useSystemStore.setState({secrets: [...secrets].sort((a, b) => a.name.localeCompare(b.name))});
        });
        SystemApi.getConfigMaps((configmaps: KubernetesConfigMap[]) => {
            useSystemStore.setState({configmaps: [...configmaps].sort((a, b) => a.name.localeCompare(b.name))});
        });
        SystemApi.getEnvVars((envVars: string[]) => {
            useSystemStore.setState({envVars: [...envVars].sort()});
        });
        SystemApi.getAppProps((appProps: string[]) => {
            useSystemStore.setState({appProps: [...appProps].sort()});
        });
    }
}