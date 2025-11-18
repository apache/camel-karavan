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
package org.apache.camel.karavan.api;

import io.quarkus.security.identity.SecurityIdentity;
import io.vertx.core.json.JsonObject;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.KaravanCache;

public class AbstractApiResource {

    @Inject
    SecurityIdentity identity;

    @Inject
    KaravanCache karavanCache;

    protected JsonObject getIdentity() {
        if (identity == null || identity.isAnonymous()) {
            return JsonObject.of()
                    .put("email", null)
                    .put("username", (String) null)
                    .put("roles", new java.util.ArrayList<>());
        }

        String username = identity.getPrincipal().getName();
        var user = karavanCache.getUser(username);

        return JsonObject.of()
                .put("email", user != null ? user.getEmail() : null)
                .put("username", username)
                .put("roles", new java.util.ArrayList<>(identity.getRoles())); // from Quarkus
    }
}