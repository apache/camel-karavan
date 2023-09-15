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

import { CamelElement } from './IntegrationDefinition';
import { FromDefinition } from './CamelDefinition';

export class TopologyRestNode {
    path: string;
    id: string;
    routeIds: string[];
    title: string;
    fileName: string;

    constructor(path: string, id: string, routeIds: string[], title: string, fileName: string) {
        this.path = path;
        this.id = id;
        this.routeIds = routeIds;
        this.title = title;
        this.fileName = fileName;
    }
}

export class TopologyIncomingNode {
    id: string;
    type: 'internal' | 'external';
    routeId: string;
    title: string;
    fileName: string;
    from: FromDefinition;
    
    constructor(id: string, type: 'internal' | 'external', routeId: string, title: string, fileName: string, from: FromDefinition) {
        this.id = id;
        this.type = type;
        this.routeId = routeId;
        this.title = title;
        this.fileName = fileName;
        this.from = from;
    }
}

export class TopologyRouteNode {
    id: string;
    routeId: string;
    title: string;
    fileName: string;
    from: FromDefinition;

    constructor(id: string, routeId: string, title: string, fileName: string, from: FromDefinition) {
        this.id = id;
        this.routeId = routeId;
        this.title = title;
        this.fileName = fileName;
        this.from = from;
    }
}

export class TopologyOutgoingNode {
    id: string;
    type: 'internal' | 'external';
    routeId: string;
    title: string;
    fileName: string;
    step: CamelElement;

    constructor(id: string, type: 'internal' | 'external', routeId: string, title: string, fileName: string, step: CamelElement) {
        this.id = id;
        this.type = type
        this.routeId = routeId;
        this.title = title;
        this.fileName = fileName;
        this.step = step;
    }
}