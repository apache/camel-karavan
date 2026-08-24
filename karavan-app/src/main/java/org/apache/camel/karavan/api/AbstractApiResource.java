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
import io.vertx.core.json.JsonArray;
import io.vertx.core.json.JsonObject;
import jakarta.inject.Inject;
import org.apache.camel.karavan.cache.AccessUser;
import org.apache.camel.karavan.cache.KaravanCache;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.jboss.logging.Logger;

import java.util.Objects;

public class AbstractApiResource {

    private static final Logger LOGGER = Logger.getLogger(AbstractApiResource.class.getName());

    @ConfigProperty(name = "platform.auth", defaultValue = "session")
    String authStrategy;

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
        var roles = new JsonArray(new java.util.ArrayList<>(identity.getRoles()));
        var roleList = roles.stream().map(Object::toString).toList();
        var user = karavanCache.getUser(username);

        if ("oidc".equalsIgnoreCase(authStrategy)) {
            JsonWebToken jwt = (JsonWebToken) identity.getPrincipal();
            String firstName = jwt.getClaim("given_name");
            String lastName = jwt.getClaim("family_name");
            String email = jwt.getClaim("email");
            if (user == null) {
                LOGGER.info("OIDC User not found in Talisman Database. Creating new one.");
                user = new AccessUser(username, firstName, lastName, email, AccessUser.UserStatus.ACTIVE, roleList);
                karavanCache.saveUser(user, true);
            }  else if (!Objects.equals(firstName, user.getFirstName()) || !Objects.equals(lastName, user.getLastName()) || !Objects.equals(email, user.getEmail())) {
                LOGGER.info("OIDC User found in Talisman Database. User is outdated. Updating user.");
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setEmail(email);
                user.setRoles(roleList);
                karavanCache.saveUser(user, true);
            }
        }

        return JsonObject.of()
                .put("email", user != null ? user.getEmail() : null)
                .put("username", username)
                .put("roles", roles);
    }
}