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

import {
    ComponentFactory,
    EdgeAnimationSpeed,
    EdgeModel,
    EdgeStyle,
    GraphComponent,
    Model,
    ModelKind,
    NodeModel,
    NodeShape,
    NodeStatus,
    withPanZoom, withSelection
} from '@patternfly/react-topology';
import CustomNode from "./CustomNode";
import {Integration} from "core/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "core/api/CamelDefinitionYaml";
import {TopologyUtils} from "core/api/TopologyUtils";
import {
    TopologyIncomingNode,
    TopologyOutgoingNode,
    TopologyRestNode,
    TopologyRouteNode
} from "core/model/TopologyDefinition";
import CustomEdge from "./CustomEdge";
import {IntegrationFile} from "core/model/IntegrationDefinition";
import CustomGroup from "./CustomGroup";

const NODE_DIAMETER = 60;

export function getIntegrations(files: IntegrationFile[]): Integration[] {
    return files.filter((file) => file.name.endsWith(".camel.yaml")).map((file) => {
        return CamelDefinitionYaml.yamlToIntegration(file.name, file.code);
    })
}

export function getIncomingNodes(tins: TopologyIncomingNode[]): NodeModel[] {
    return tins.filter(tin => tin.type === 'external').map(tin => {
        return {
            id: tin.id,
            type: 'node',
            label: tin.title,
            width: NODE_DIAMETER,
            height: NODE_DIAMETER,
            shape: NodeShape.ellipse,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: tin.connectorType,
                icon: 'element',
                type: 'step',
                step: tin.from,
                fileName: tin.fileName
            }
        }
    });
}

export function getRoutes(tins: TopologyRouteNode[]): NodeModel[] {
    return tins.map(tin => {
        const node: NodeModel = {
            id: tin.id,
            type: 'node',
            label: tin.title,
            width: NODE_DIAMETER,
            height: NODE_DIAMETER,
            shape: NodeShape.rect,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                type: 'route',
                icon: 'route',
                step: tin.route,
                routeId: tin.routeId,
                fileName: tin.fileName,
            }
        }
        return node;
    });
}

export function getOutgoingNodes(tons: TopologyOutgoingNode[]): NodeModel[] {
    return tons.filter(tin => tin.type === 'external').map(tin => {
        const node: NodeModel = {
            id: tin.id,
            type: 'node',
            label: tin.title,
            width: NODE_DIAMETER,
            height: NODE_DIAMETER,
            shape: NodeShape.ellipse,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                icon: 'element',
                type: 'step',
                step: tin.step,
                badge: tin.connectorType,
                fileName: tin.fileName
            }
        }
        return node;
    });
}

export function getIncomingEdges(tins: TopologyIncomingNode[]): EdgeModel[] {
    return tins.filter(tin => tin.type === 'external').map(tin => {
        const node: EdgeModel = {
            id: 'edge-incoming-' + tin.routeId,
            type: 'edge',
            source: tin.id,
            target: 'route-' + tin.routeId,
            edgeStyle: tin.type === 'external' ? EdgeStyle.dashedMd : EdgeStyle.solid,
            animationSpeed: tin.type === 'external' ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none
        }
        return node;
    });
}

export function getOutgoingEdges(tons: TopologyOutgoingNode[]): EdgeModel[] {
    return tons.filter(tin => tin.type === 'external').map(tin => {
        const node: EdgeModel = {
            id: 'edge-outgoing-' + tin.routeId + '-' + (tin.step as any).id,
            type: 'edge',
            source: 'route-' + tin.routeId,
            target: tin.id,
            edgeStyle: tin.type === 'external' ? EdgeStyle.dashedMd : EdgeStyle.solid,
            animationSpeed: tin.type === 'external' ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none
        }
        return node;
    });
}

export function getExternalEdges(tons: TopologyOutgoingNode[], tins: TopologyIncomingNode[]): EdgeModel[] {
    const result: EdgeModel[]= [];
    tons.filter(ton => ton.type === 'external').forEach((ton, index) => {
        const uniqueUri = ton.uniqueUri;
        if (uniqueUri) {
            const target = TopologyUtils.getNodeIdByUniqueUri(tins, uniqueUri);
            const node: EdgeModel = {
                id: 'external-' + ton.id + '-' + index,
                type: 'edge',
                source: ton.id,
                target: target,
                edgeStyle: EdgeStyle.dotted,
                animationSpeed: EdgeAnimationSpeed.slow
            }
            if (target) result.push(node);
        }
    });
    return result;
}

export function getRestNodes(tins: TopologyRestNode[]): NodeModel[] {
    return tins.map(tin => {
        return {
            id: tin.id,
            type: 'node',
            label: tin.title,
            width: NODE_DIAMETER,
            height: NODE_DIAMETER,
            shape: NodeShape.hexagon,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                icon: 'rest',
                type: 'rest',
                step: tin.rest,
                fileName: tin.fileName
            }
        }
    });
}

export function getRestEdges(rest: TopologyRestNode[], tins: TopologyIncomingNode[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    rest.forEach(tin => {
        tin.uris.forEach((uri, index) => {
            const target = TopologyUtils.getRouteIdByUri(tins, uri);
            const node: EdgeModel = {
                id: 'incoming-' + tin.id + '-' + index,
                type: 'edge',
                source: tin.id,
                target: target,
                edgeStyle: EdgeStyle.solid,
                animationSpeed: EdgeAnimationSpeed.medium
            }
            if (target) result.push(node);
        })
    });
    return result;
}

export function getInternalEdges(tons: TopologyOutgoingNode[], tins: TopologyIncomingNode[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    tons.filter(ton => ton.type === 'internal').forEach((ton, index) => {
        const uri: string = (ton.step as any).uri;
        if (uri.startsWith("direct") || uri.startsWith("seda")) {
            const name = (ton.step as any).parameters.name;
            const target = TopologyUtils.getRouteIdByUriAndName(tins, uri, name);
                const node: EdgeModel = {
                id: 'internal-' + ton.id + '-' + index,
                type: 'edge',
                source: 'route-' + ton.routeId,
                target: target,
                edgeStyle: EdgeStyle.solid,
                animationSpeed: EdgeAnimationSpeed.medium
            }
            if (target) result.push(node);
        }
    });
    return result;
}

export function getModel(files: IntegrationFile[]): Model {
    const integrations = getIntegrations(files);
    const tins = TopologyUtils.findTopologyIncomingNodes(integrations);
    const troutes = TopologyUtils.findTopologyRouteNodes(integrations);
    const tons = TopologyUtils.findTopologyOutgoingNodes(integrations);
    const trestns = TopologyUtils.findTopologyRestNodes(integrations);

    const nodes: NodeModel[] = [];
    const groups: NodeModel[] = troutes.map(r => {
        const children = [r.id]
        children.push(...tins.filter(i => i.routeId === r.routeId && i.type === 'external').map(i => i.id));
        children.push(...tons.filter(i => i.routeId === r.routeId && i.type === 'external').map(i => i.id));
        return   {
            id: 'group-' + r.routeId,
            children: children,
            type: 'group',
            group: true,
            label: r.title,
            style: {
                padding: 40
            }
        }
    })

    nodes.push(...getRestNodes(trestns))
    nodes.push(...getIncomingNodes(tins))
    nodes.push(...getRoutes(troutes))
    nodes.push(...getOutgoingNodes(tons))
    // nodes.push(...groups)

    const edges: EdgeModel[] = [];
    edges.push(...getIncomingEdges(tins));
    edges.push(...getOutgoingEdges(tons));
    edges.push(...getRestEdges(trestns, tins));
    edges.push(...getInternalEdges(tons, tins));
    edges.push(...getExternalEdges(tons,tins));

    return {nodes: nodes, edges: edges, graph: {id: 'g1', type: 'graph', layout: 'Dagre'}};
}

export const customComponentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
    switch (type) {
        case 'group':
            return withSelection()(CustomGroup);
        default:
            switch (kind) {
                case ModelKind.graph:
                    return withPanZoom()(GraphComponent);
                case ModelKind.node:
                    return (withSelection()(CustomNode));
                case ModelKind.edge:
                    return (withSelection()(CustomEdge));
                default:
                    return undefined;
            }
    }
}