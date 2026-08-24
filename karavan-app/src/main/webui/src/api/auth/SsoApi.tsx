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
import {AuthApi, setCurrentUser} from "./AuthApi";
import {AccessUser} from "@models/AccessModels";

// Refresh the access token when it has less than this many seconds left.
// Must be comfortably larger than the polling/SSE reconnect period so a token
// never reaches the backend after its `exp`.
const MIN_VALIDITY_SECONDS = 70;

// How often the background watchdog checks the token. Keycloak only fires
// `onTokenExpired` while the tab is alive; the interval also covers the case
// where the tab was suspended (laptop sleep, background tab throttling).
const REFRESH_CHECK_MS = 20_000;

export class SsoApi {

    static keycloak?: Keycloak;

    private static refreshTimer?: number;
    // De-duplicates concurrent refreshes: dozens of pollers can ask for a token
    // in the same tick, and Keycloak must not be hit with parallel refresh calls
    // (with `refreshTokenMaxReuse=0` the losers would invalidate the session).
    private static refreshPromise?: Promise<boolean>;

    static auth(after: () => void) {
        AuthApi.getSsoConfig((config: any) => {
            SsoApi.keycloak = new Keycloak({url: config.url, realm: config.realm, clientId: config.clientId});
            SsoApi.keycloak.onTokenExpired = () => {
                console.log('SsoApi', 'Access token expired, refreshing.');
                SsoApi.updateToken().catch(reason => console.log('SsoApi', 'Refresh on expiry failed:', reason));
            };
            SsoApi.keycloak.init({
                flow: "standard",
                pkceMethod: "S256",
                onLoad: 'login-required',
                checkLoginIframe: false,
                silentCheckSsoRedirectUri: `${location.origin}/silent-check-sso.html`
            }).then(authenticated => {
                if (authenticated) {
                    const k = SsoApi.keycloak;
                    if (k) {
                        const userInfo = {
                            username: k.tokenParsed?.preferred_username,
                            roles: k.tokenParsed?.realm_access?.roles || [],
                        };
                        console.log('SsoApi', 'User is now authenticated.', userInfo);
                        setCurrentUser(userInfo as AccessUser);
                        SsoApi.startRefreshWatchdog();
                    }
                } else {
                    console.log('User is not authenticated');
                }
                after();
            }).catch(reason => {
                console.log('SsoApi', 'Error:', reason);
                // Still notify the caller so it can leave its "loading" state
                // instead of hanging on a blank screen.
                after();
            });
        });
    }

    /**
     * Refreshes the access token if it expires within `MIN_VALIDITY_SECONDS`.
     * Concurrent callers share a single in-flight refresh.
     * Resolves to true when a new token was actually fetched.
     */
    static updateToken(minValidity: number = MIN_VALIDITY_SECONDS): Promise<boolean> {
        const k = SsoApi.keycloak;
        if (!k?.authenticated) {
            return Promise.resolve(false);
        }
        if (!SsoApi.refreshPromise) {
            SsoApi.refreshPromise = k.updateToken(minValidity)
                .catch(reason => {
                    // The refresh token itself is gone (SSO idle timeout / session
                    // revoked). Nothing to salvage: bounce the user to the IdP
                    // instead of hammering the backend with a dead access token.
                    console.log('SsoApi', 'Token refresh failed, re-authenticating:', reason);
                    SsoApi.stopRefreshWatchdog();
                    setCurrentUser(null);
                    k.login();
                    return false;
                })
                .finally(() => {
                    SsoApi.refreshPromise = undefined;
                });
        }
        return SsoApi.refreshPromise;
    }

    /**
     * Single entry point for anything that needs to put a bearer token on a
     * request. Always returns a token that is still valid, refreshing first
     * when needed, so an expired JWT never reaches the backend.
     */
    static async getValidToken(): Promise<string | undefined> {
        const k = SsoApi.keycloak;
        if (!k?.authenticated) {
            return undefined;
        }
        await SsoApi.updateToken();
        return SsoApi.keycloak?.token;
    }

    private static startRefreshWatchdog() {
        SsoApi.stopRefreshWatchdog();
        SsoApi.refreshTimer = window.setInterval(() => {
            SsoApi.updateToken().catch(reason => console.log('SsoApi', 'Scheduled refresh failed:', reason));
        }, REFRESH_CHECK_MS);
        // A suspended tab misses its intervals; re-check as soon as it is visible again.
        document.addEventListener('visibilitychange', SsoApi.onVisibilityChange);
    }

    private static stopRefreshWatchdog() {
        if (SsoApi.refreshTimer !== undefined) {
            window.clearInterval(SsoApi.refreshTimer);
            SsoApi.refreshTimer = undefined;
        }
        document.removeEventListener('visibilitychange', SsoApi.onVisibilityChange);
    }

    private static onVisibilityChange = () => {
        if (!document.hidden) {
            SsoApi.updateToken().catch(reason => console.log('SsoApi', 'Refresh on resume failed:', reason));
        }
    };

    static logout(after: () => void) {
        if (SsoApi.keycloak) {
            SsoApi.stopRefreshWatchdog();
            SsoApi.keycloak.logout().then(value => {
                console.log('SsoApi', 'User is now logout.');
                setCurrentUser(null)
            }).catch(reason => {
                console.log('SsoApi', 'Error:', reason);
            });
        }
    }
}
