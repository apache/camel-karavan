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
import {KaravanApi} from "./KaravanApi";
import {EventBus} from "../designer/utils/EventBus";
import {EventSourceMessage} from "@microsoft/fetch-event-source/lib/cjs/parse";
import {KaravanEvent, NotificationEventBus} from "./NotificationService";

export class NotificationApi {

     static getKaravanEvent (ev: EventSourceMessage, type: 'system' | 'user') {
        const eventParts = ev.event?.split(':');
        const event = eventParts?.length > 1 ? eventParts[0] : undefined;
        const className = eventParts?.length > 1 ? eventParts[1] : undefined;
        return new KaravanEvent({id: ev.id, event: event, type: type, className: className, data: JSON.parse(ev.data)});
    }

    static onSystemMessage (ev: EventSourceMessage) {
        const ke = NotificationApi.getKaravanEvent(ev, 'system');
        NotificationEventBus.sendEvent(ke);
    }

    static onUserMessage (ev: EventSourceMessage) {
        const ke = NotificationApi.getKaravanEvent(ev, 'user');
        NotificationEventBus.sendEvent(ke);
    }

    static async notification(controller: AbortController) {
        const fetchData = async () => {
            const headers: any = { Accept: "text/event-stream" };
            if (KaravanApi.authType === 'oidc') {
                headers.Authorization = "Bearer " + SsoApi.keycloak?.token
            }
            NotificationApi.fetch('/api/notification/system', controller, headers,
                    ev => NotificationApi.onSystemMessage(ev));
            NotificationApi.fetch('/api/notification/user/' + KaravanApi.getUserId(), controller, headers,
                ev => NotificationApi.onUserMessage(ev));
        };
        return fetchData();
    };

    static async fetch(input: string, controller: AbortController, headers: any, onmessage: (ev: EventSourceMessage) => void) {
        fetchEventSource(input, {
            method: "GET",
            headers: headers,
            signal: controller.signal,
            async onopen(response) {
                if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
                    return; // everything's good
                } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                    // client-side errors are usually non-retriable:
                    console.log("Server side error ", response);
                    EventBus.sendAlert("Error fetching", `${input} : ${response.statusText}`, "danger");
                } else {
                    console.log("Error ", response);
                    EventBus.sendAlert("Error fetching", `${input} : ${response.statusText}`, "danger");
                }
            },
            onmessage(event) {
                onmessage(event);
            },
            onclose() {
                console.log("Connection closed by the server");
            },
            onerror(err) {
                console.log("There was an error from server", err);
            },
        });
    }
}
