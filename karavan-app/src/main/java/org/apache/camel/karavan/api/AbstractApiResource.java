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

import io.quarkus.oidc.UserInfo;
import io.quarkus.security.identity.SecurityIdentity;
import io.smallrye.jwt.auth.principal.DefaultJWTCallerPrincipal;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.SecurityContext;
import org.eclipse.microprofile.jwt.Claims;

import java.util.HashMap;
import java.util.Objects;


public class AbstractApiResource {

    @Inject
    SecurityIdentity securityIdentity;

    public HashMap<String, String> getIdentity(SecurityContext securityContext) {
        var identity = new HashMap<String, String>();
        identity.put("email", "karavan@test.org");

        if (securityContext != null && securityContext.getUserPrincipal() != null && securityContext.getUserPrincipal() instanceof DefaultJWTCallerPrincipal principal) {
            identity.put("name", principal.getName());
            identity.put("email", principal.getClaim(Claims.email));
        } else if (securityIdentity != null) {
            if (securityIdentity.getPrincipal() != null) {
                identity.put("name", securityIdentity.getPrincipal().getName());
            }
            if (securityIdentity.getAttributes().get("email") != null && !securityIdentity.getAttributes().get("email").toString().isBlank()) {
                identity.put("email", securityIdentity.getAttributes().get("email").toString());
            } else if (securityIdentity.getAttributes().get("userinfo") != null) {
                UserInfo userInfo = (UserInfo) securityIdentity.getAttributes().get("userinfo");
                String email = Objects.isNull(userInfo.getEmail()) || userInfo.getEmail().isBlank() ? "karavan@test.org" : userInfo.getEmail();
                identity.put("email", email);
            }
        }
        return identity;
    }
}