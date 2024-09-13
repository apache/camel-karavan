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
import {unstable_batchedUpdates} from "react-dom";
import {useProjectStore} from "./ProjectStore";
import {ProjectService} from "./ProjectService";
import {EventBus} from "../designer/utils/EventBus";

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

const sub = NotificationEventBus.onEvent()?.subscribe((event: KaravanEvent) => {
    if (event.event === 'configShared') {
        const filename = event.data?.filename ? event.data?.filename : 'all'
        EventBus.sendAlert('Success', 'Configuration shared for ' + filename);
    } else if (event.event === 'commit' && event.className === 'Project') {
        const projectId = event.data?.projectId;
        if (useProjectStore.getState().project?.projectId === projectId) {
            unstable_batchedUpdates(() => {
                useProjectStore.setState({isPushing: false});
                ProjectService.refreshProject(projectId);
                ProjectService.refreshProjectData(projectId);
            });
        }
    } else if (event.event === 'imagesLoaded') {
        const projectId = event.data?.projectId;
        unstable_batchedUpdates(() => {
            ProjectService.refreshImages(projectId);
        });
    } else if (event.event === 'error') {
        const error = event.data?.error;
        EventBus.sendAlert('Error', error, "danger");
    } else if (event.event === 'ping') {
        // do nothing
    } else {
        const message = event.data?.message ?  event.data?.message : JSON.stringify(event.data);
        EventBus.sendAlert('Success', message);
    }
});

