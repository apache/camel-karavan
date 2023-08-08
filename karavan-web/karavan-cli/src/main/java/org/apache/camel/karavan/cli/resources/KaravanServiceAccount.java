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
package org.apache.camel.karavan.cli.resources;

import io.fabric8.kubernetes.api.model.ServiceAccount;
import io.fabric8.kubernetes.api.model.ServiceAccountBuilder;
import org.apache.camel.karavan.cli.Constants;
import org.apache.camel.karavan.cli.KaravanCommand;
import org.apache.camel.karavan.cli.ResourceUtils;

import java.util.Map;

public class KaravanServiceAccount {

    public static ServiceAccount getServiceAccount(KaravanCommand config) {
        return new ServiceAccountBuilder()
                .withNewMetadata()
                .withName(Constants.SERVICEACCOUNT_KARAVAN)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(Constants.SERVICEACCOUNT_KARAVAN, config.getVersion(), Map.of()))
                .endMetadata()
                .build();
    }

    public static ServiceAccount getServiceAccountPipeline(KaravanCommand config) {
        return new ServiceAccountBuilder()
                .withNewMetadata()
                .withName(Constants.SERVICEACCOUNT_PIPELINE)
                .withNamespace(config.getNamespace())
                .withLabels(ResourceUtils.getLabels(Constants.SERVICEACCOUNT_PIPELINE, config.getVersion(), Map.of()))
                .endMetadata()
                .build();
    }
}
