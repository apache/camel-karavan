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
package org.apache.camel.karavan.operator.watcher;

import io.fabric8.kubernetes.api.model.HasMetadata;
import io.fabric8.kubernetes.api.model.apiextensions.v1.CustomResourceDefinition;
import io.fabric8.kubernetes.api.model.apiextensions.v1.CustomResourceDefinitionSpec;
import io.fabric8.kubernetes.client.KubernetesClient;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import io.quarkus.runtime.Quarkus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Objects;
import java.util.function.Supplier;

public class TektonCrdEventHandler<T extends HasMetadata> implements ResourceEventHandler<CustomResourceDefinition> {
    static final Logger log = LoggerFactory.getLogger(TektonCrdEventHandler.class);

    private final Supplier<? extends T> obj;

    private boolean initTektonInstalled;

    public TektonCrdEventHandler(Supplier<? extends T> obj, boolean initTektonInstalled) {
        this.obj = Objects.requireNonNull(obj);
        this.initTektonInstalled = initTektonInstalled;
    }

    @Override
    public void onAdd(CustomResourceDefinition crd) {
        if (!initTektonInstalled && isTektonCustomResource(crd.getSpec())) {
            // This is hack while OJSDK doesn't support dynamic EventSource reload.
            // Just restart whole Quarkus application.
            log.info("Restarting Karavan operator as Tekton resources have been installed...");
            Quarkus.asyncExit();
        }
    }

    @Override
    public void onUpdate(CustomResourceDefinition oldCrd, CustomResourceDefinition newCrd) {}

    @Override
    public void onDelete(CustomResourceDefinition obj, boolean deletedFinalStateUnknown) {}

    private boolean isTektonCustomResource(CustomResourceDefinitionSpec spec) {
        return spec.getVersions().stream().anyMatch(ver -> (spec.getGroup() + "/" + ver.getName() + "/" + spec.getNames().getKind())
                .equalsIgnoreCase(obj.get().getApiVersion() + "/" + obj.get().getKind()));
    }
}
