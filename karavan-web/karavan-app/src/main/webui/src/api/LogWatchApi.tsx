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

import {SsoApi} from "./SsoApi";
import {EventStreamContentType, fetchEventSource} from "@microsoft/fetch-event-source";
import {ProjectEventBus} from "./ProjectEventBus";
import {KaravanApi} from "./KaravanApi";

export class LogWatchApi {

    static async fetchData(type: 'container' | 'build' | 'none', podName: string, controller: AbortController) {
        const fetchData = async () => {
            const headers: any = { Accept: "text/event-stream" };
            if (KaravanApi.authType === 'oidc') {
                headers.Authorization = "Bearer " + SsoApi.keycloak?.token
            }
            await fetchEventSource("/api/logwatch/" + type + "/" + podName, {
                method: "GET",
                headers: headers,
                signal: controller.signal,
                async onopen(response) {
                    if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
                        return; // everything's good
                    } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        // client-side errors are usually non-retriable:
                        console.log("Server side error ", response);
                    } else {
                        console.log("Error ", response);
                    }
                },
                onmessage(event) {
                    ProjectEventBus.sendLog('add', event.data);
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
