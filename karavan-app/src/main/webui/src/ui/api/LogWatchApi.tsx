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

import {SsoApi} from "@api/auth/SsoApi";
import {fetchEventSource} from "@microsoft/fetch-event-source";
import {ProjectEventBus} from "@bus/ProjectEventBus";
import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";

export class LogWatchApi {

    static async fetchData(type: 'container' | 'build' | 'none', podName: string, controller: AbortController) {
        console.log("Fetch Started for: " + podName);
        const fetchData = async () => {
            const headers: Record<string, string> = {
                Accept: "text/event-stream",
            };
            const url = `/ui/logwatch/${type}/${podName}/${getCurrentUser()?.username ?? ""}`;
            if (AuthApi.authType === 'oidc' && SsoApi.keycloak?.token && SsoApi.keycloak?.token?.length > 0) {
                headers.Authorization = "Bearer " + SsoApi.keycloak?.token;
            }
            await fetchEventSource(url, {
                method: "GET", headers: headers, signal: controller.signal, credentials: "include",
                async onopen(response) {
                    const ct = response.headers.get("content-type") || "";
                    if (response.ok && ct.toLowerCase().startsWith("text/event-stream")) {
                        return; // good to go
                    }
                    // Handle auth and other errors explicitly
                    if (response.status === 401) {
                        console.warn("SSE unauthorized: session missing/expired.");
                        // Optional: trigger a global event/router redirect here
                        throw new Error("unauthorized");
                    }
                    console.error("Unexpected SSE response", response.status, ct);
                    throw new Error(`bad-sse-response:${response.status}`);
                },
                onmessage(event) {
                    if (event.event !== 'ping') {
                        ProjectEventBus.sendLog('add', event.data);
                    } else {
                        console.log('Logger SSE Ping', event);
                    }
                },
                onclose() {
                    console.log("Connection closed by the server");
                },
                onerror(err) {
                    console.log("There was an error from server", err);
                },
            });
        };
        return fetchData();
    }
}
