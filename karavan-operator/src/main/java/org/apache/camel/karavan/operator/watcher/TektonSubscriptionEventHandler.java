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

import io.fabric8.kubernetes.client.informers.ResourceEventHandler;
import io.fabric8.openshift.api.model.operatorhub.v1alpha1.Subscription;
import org.apache.camel.karavan.operator.KaravanReconciler;

public class TektonSubscriptionEventHandler implements ResourceEventHandler<Subscription> {

    private static final String NAME = "openshift-pipelines-operator";

    private KaravanReconciler karavanReconciler;

    public TektonSubscriptionEventHandler(KaravanReconciler karavanReconciler) {
        this.karavanReconciler = karavanReconciler;
    }

    @Override
    public void onAdd(Subscription subscription) {
        if (subscription.getMetadata().getName().contains(NAME)) {
            karavanReconciler.addTektonResources();
        }
    }

    @Override
    public void onUpdate(Subscription oldSubscription, Subscription newSubscription) {
        if (newSubscription.getMetadata().getName().contains(NAME)) {
            karavanReconciler.addTektonResources();
        }
    }

    @Override
    public void onDelete(Subscription obj, boolean deletedFinalStateUnknown) {

    }
}
