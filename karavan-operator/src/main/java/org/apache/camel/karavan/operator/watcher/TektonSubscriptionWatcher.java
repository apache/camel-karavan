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

import io.fabric8.kubernetes.client.Watcher;
import io.fabric8.kubernetes.client.WatcherException;
import io.fabric8.openshift.api.model.operatorhub.v1alpha1.Subscription;
import org.apache.camel.karavan.operator.KaravanReconciler;

import java.util.List;

public class TektonSubscriptionWatcher implements Watcher<Subscription> {

    private KaravanReconciler karavanReconciler;

    public TektonSubscriptionWatcher(KaravanReconciler karavanReconciler) {
        this.karavanReconciler = karavanReconciler;
    }

    @Override
    public void eventReceived(Action action, Subscription resource) {
        if (List.of("ADDED").contains(action.name()) && resource.getMetadata().getName().contains("openshift-pipelines-operator")) {
            karavanReconciler.addTektonResources();
        }
    }

    @Override
    public void onClose(WatcherException cause) {

    }
}
