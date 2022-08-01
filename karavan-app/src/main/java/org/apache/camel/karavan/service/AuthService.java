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
package org.apache.camel.karavan.service;

import io.fabric8.kubernetes.api.model.Secret;
import io.smallrye.mutiny.tuples.Tuple2;
import io.vertx.core.Vertx;
import org.apache.camel.karavan.model.GitConfig;
import org.eclipse.microprofile.config.ConfigProvider;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

@ApplicationScoped
public class AuthService {

    @Inject
    Vertx vertx;

    @Inject
    KubernetesService kubernetesService;

    private static final Logger LOGGER = Logger.getLogger(AuthService.class.getName());

    private Tuple2<String, String> getMasterConfig() {
        if (kubernetesService.inKubernetes()){
            Secret secret =  kubernetesService.getKaravanSecret();
            String username = new String(Base64.getDecoder().decode(secret.getData().get("master-username").getBytes(StandardCharsets.UTF_8)));
            String password = new String(Base64.getDecoder().decode(secret.getData().get("master-password").getBytes(StandardCharsets.UTF_8)));
            return Tuple2.of(username, password);
        } else {
            String username = ConfigProvider.getConfig().getValue("karavan.master-username", String.class);
            String password = ConfigProvider.getConfig().getValue("karavan.master-password", String.class);
            return Tuple2.of(username, password);
        }
    }

    public boolean login(String basicAuth) {
        Tuple2<String, String> master = getMasterConfig();
        String secretToken = new String(Base64.getEncoder().encode((master.getItem1() + ":" + master.getItem2()).getBytes()));
        String auth = "Basic " + secretToken;
        return auth.equals(basicAuth);
    }
}
