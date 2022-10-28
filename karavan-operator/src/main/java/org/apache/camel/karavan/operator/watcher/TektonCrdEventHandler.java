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

import io.fabric8.kubernetes.api.model.apiextensions.v1.CustomResourceDefinition;
import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import org.apache.camel.karavan.operator.KaravanReconciler;

public class TektonCrdEventHandler implements ResourceEventHandler<CustomResourceDefinition> {

    private static final String NAME = "pipelines.tekton.dev";

    private KaravanReconciler karavanReconciler;

    public TektonCrdEventHandler(KaravanReconciler karavanReconciler) {
        this.karavanReconciler = karavanReconciler;
    }

    @Override
    public void onAdd(CustomResourceDefinition crd) {
        if (crd.getMetadata().getName().contains(NAME)) {
            karavanReconciler.addTektonResources();
        }
    }

    @Override
    public void onUpdate(CustomResourceDefinition crd1, CustomResourceDefinition crd2) {
        if (crd2.getMetadata().getName().contains(NAME)) {
            karavanReconciler.addTektonResources();
        }
    }

    @Override
    public void onDelete(CustomResourceDefinition obj, boolean deletedFinalStateUnknown) {

    }
}
