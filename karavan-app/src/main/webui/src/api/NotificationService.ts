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

import {Subject} from "rxjs";
import {ProjectEventBus} from "./ProjectEventBus";
import {unstable_batchedUpdates} from "react-dom";
import {useLogStore, useProjectStore} from "./ProjectStore";
import {ProjectService} from "./ProjectService";

export class KaravanEvent {
    id: string = '';
    type: 'system' | 'user' = 'system';
    event: string = '';
    className: string = '';
    data: any = {};

    public constructor(init?: Partial<KaravanEvent>) {
        Object.assign(this, init);
    }
}

const karavanEvents = new Subject<KaravanEvent>();

export const NotificationEventBus = {
    sendEvent: (event: KaravanEvent) =>  karavanEvents.next(event),
    onEvent: () => karavanEvents.asObservable(),
}

console.log("Start Notification subscriber");
const sub = NotificationEventBus.onEvent()?.subscribe((event: KaravanEvent) => {
    // console.log('KaravanEvent', event);
    if (event.event === 'commit' && event.className === 'Project') {
        const projectId = event.data?.projectId;
        if (useProjectStore.getState().project?.projectId === projectId) {
            unstable_batchedUpdates(() => {
                useProjectStore.setState({isPushing: false});
                ProjectService.refreshProject(projectId);
                ProjectService.refreshProjectData(projectId);
            });
        }
    }
});

