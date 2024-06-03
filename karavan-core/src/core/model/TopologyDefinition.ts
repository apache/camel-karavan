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
import { FromDefinition, RestDefinition, RouteConfigurationDefinition, RouteDefinition } from './CamelDefinition';

export class TopologyRestNode {
    path: string;
    id: string;
    uris: string[];
    title: string;
    fileName: string;
    rest: RestDefinition;

    constructor(path: string, id: string, uris: string[], title: string, fileName: string, rest: RestDefinition) {
        this.path = path;
        this.id = id;
        this.uris = uris;
        this.title = title;
        this.fileName = fileName;
        this.rest = rest;
    }
}

export class TopologyIncomingNode {
    id: string;
    type: 'internal' | 'external';
    connectorType: 'component' | 'kamelet';
    routeId: string;
    title: string;
    fileName: string;
    from: FromDefinition;
    uniqueUri?: string;


    constructor(id: string, type: "internal" | "external", connectorType: "component" | "kamelet", routeId: string, title: string, fileName: string, from: FromDefinition, uniqueUri: string) {
        this.id = id;
        this.type = type;
        this.connectorType = connectorType;
        this.routeId = routeId;
        this.title = title;
        this.fileName = fileName;
        this.from = from;
        this.uniqueUri = uniqueUri;
    }
}

export class TopologyRouteNode {
    id: string;
    routeId: string;
    title: string;
    fileName: string;
    from: FromDefinition;
    route: RouteDefinition

    constructor(id: string, routeId: string, title: string, fileName: string, from: FromDefinition, route: RouteDefinition) {
        this.id = id;
        this.routeId = routeId;
        this.title = title;
        this.fileName = fileName;
        this.from = from;
        this.route = route;
    }
}

export class TopologyRouteConfigurationNode {
    id: string;
    routeConfigurationId: string;
    title: string;
    fileName: string;
    routeConfiguration: RouteConfigurationDefinition

    constructor(id: string, routeConfigurationId: string, title: string, fileName: string, routeConfiguration: RouteConfigurationDefinition) {
        this.id = id;
        this.routeConfigurationId = routeConfigurationId;
        this.title = title;
        this.fileName = fileName;
        this.routeConfiguration = routeConfiguration;
    }
}

export class TopologyOutgoingNode {
    id: string;
    type: 'internal' | 'external';
    connectorType: 'component' | 'kamelet';
    routeId: string;
    title: string;
    fileName: string;
    step: CamelElement;
    uniqueUri?: string;


    constructor(id: string, type: "internal" | "external", connectorType: "component" | "kamelet", routeId: string, title: string, fileName: string, step: CamelElement, uniqueUri: string) {
        this.id = id;
        this.type = type;
        this.connectorType = connectorType;
        this.routeId = routeId;
        this.title = title;
        this.fileName = fileName;
        this.step = step;
        this.uniqueUri = uniqueUri;
    }
}