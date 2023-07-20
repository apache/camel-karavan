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
package org.apache.camel.karavan.operator.resource;

import io.fabric8.kubernetes.api.model.PersistentVolumeClaim;
import io.fabric8.kubernetes.api.model.PersistentVolumeClaimBuilder;
import io.fabric8.kubernetes.api.model.Quantity;
import io.fabric8.kubernetes.api.model.ResourceRequirementsBuilder;
import io.javaoperatorsdk.operator.api.reconciler.Context;
import io.javaoperatorsdk.operator.api.reconciler.dependent.ReconcileResult;
import io.javaoperatorsdk.operator.processing.dependent.kubernetes.CRUDKubernetesDependentResource;
import org.apache.camel.karavan.operator.Constants;
import org.apache.camel.karavan.operator.spec.Karavan;
import org.apache.camel.karavan.operator.Utils;

import java.util.Map;

public class KaravanPvcM2Cache extends CRUDKubernetesDependentResource<PersistentVolumeClaim, Karavan> {

    public KaravanPvcM2Cache() {
        super(PersistentVolumeClaim.class);
    }

    @Override
    @SuppressWarnings("unchecked")
    public PersistentVolumeClaim desired(Karavan karavan, Context<Karavan> context) {
        return new PersistentVolumeClaimBuilder()
                .withNewMetadata()
                .withName(Constants.PVC_M2_CACHE)
                .withNamespace(karavan.getMetadata().getNamespace())
                .withLabels(Utils.getLabels(Constants.PVC_M2_CACHE, Map.of()))
                .endMetadata()
                .withNewSpec()
                .withResources(new ResourceRequirementsBuilder().withRequests(Map.of("storage", new Quantity("10Gi"))).build())
                .withVolumeMode("Filesystem")
                .withAccessModes("ReadWriteOnce")
                .endSpec()
                .build();
    }

    @Override
    public ReconcileResult<PersistentVolumeClaim> reconcile(Karavan karavan, Context<Karavan> context) {
        PersistentVolumeClaim pvc = getKubernetesClient().persistentVolumeClaims().inNamespace(karavan.getMetadata().getNamespace()).withName(Constants.PVC_M2_CACHE).get();
        if (pvc == null) {
            var desired = desired(karavan, context);
            var createdResource = handleCreate(desired, karavan, context);
            return ReconcileResult.resourceCreated(createdResource);
        } else {
            return ReconcileResult.noOperation(pvc);
        }
    }
}
