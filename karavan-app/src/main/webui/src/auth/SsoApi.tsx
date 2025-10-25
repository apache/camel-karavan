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

import Keycloak from "keycloak-js";
import {AuthApi, setCurrentUser} from "@/auth/AuthApi";
import {AccessUser} from "@/access/AccessModels";

export class SsoApi {

    static keycloak?: Keycloak;

    static auth(after: () => void) {
        AuthApi.getSsoConfig((config: any) => {
            SsoApi.keycloak = new Keycloak({url: config.url, realm: config.realm, clientId: config.clientId});
            SsoApi.keycloak.init({onLoad: 'login-required', flow: 'hybrid', checkLoginIframe: false}).then(value => {
                console.log('SsoApi', 'User is now authenticated.');
                const k = SsoApi.keycloak;
                if (k) {
                    const userInfo = {
                        username: k.tokenParsed?.preferred_username,
                        // name: k.tokenParsed?.name,
                        // email: k.tokenParsed?.email,
                        roles: k.tokenParsed?.realm_access?.roles || [],
                        // token: k.token,
                        // refreshToken: k.refreshToken,
                    };
                    // store user info globally or in your app state
                    setCurrentUser(userInfo as AccessUser);
                }
                after();
            }).catch(reason => {
                console.log('SsoApi', 'Error:', reason);
                window.location.reload();
            });
        });
    }

    static logout(after: () => void) {
        if (SsoApi.keycloak) {
            SsoApi.keycloak.logout().then(value => {
                console.log('SsoApi', 'User is now logout.');
                setCurrentUser(null)
                window.location.reload();
            }).catch(reason => {
                console.log('SsoApi', 'Error:', reason);
                window.location.reload();
            });
        }
    }
}