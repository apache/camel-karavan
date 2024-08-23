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
    withPanZoom,
    withSelection
} from '@patternfly/react-topology';
import CustomNode from "./CustomNode";
import {Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {TopologyIncomingNode, TopologyOutgoingNode, TopologyRestNode, TopologyRouteConfigurationNode, TopologyRouteNode} from "karavan-core/lib/model/TopologyDefinition";
import CustomEdge from "./CustomEdge";
import CustomGroup from "./CustomGroup";
import {INTERNAL_COMPONENTS} from "karavan-core/lib/api/ComponentApi";

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
export function getRouteConfigurations(trcs: TopologyRouteConfigurationNode[]): NodeModel[] {
    return trcs.map(tin => {
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
                type: 'routeConfiguration',
                icon: 'routeConfiguration',
                step: tin.routeConfiguration,
                routeConfigurationId: tin.routeConfigurationId,
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
            TopologyUtils.getNodeIdByUniqueUri(tins, uniqueUri).forEach(target => {
                const node: EdgeModel = {
                    id: 'external-' + ton.id + '-' + target,
                    type: 'edge',
                    source: ton.id,
                    target: target,
                    edgeStyle: EdgeStyle.dotted,
                    animationSpeed: EdgeAnimationSpeed.medium,
                    data : {groupName: uniqueUri}
                }
                result.push(node);
            });
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
                badge: 'REST',
                icon: 'rest',
                type: 'rest',
                step: tin.rest,
                fileName: tin.fileName,
                secondaryLabel: tin.title
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
        const step = (ton.step as any);
        if (step?.dslName === 'DeadLetterChannelDefinition') {
            const parts = step.deadLetterUri?.split(":");
            const uri: string = parts[0];
            const name: string = parts[1];
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
        } else {
            const uri: string = (ton.step as any).uri;
            const component = uri?.split(":")?.[0];
            if (INTERNAL_COMPONENTS.includes(component)) {
                const step = (ton.step as any);
                const name = step.parameters.name || step.parameters.address;
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
        }
    });
    return result;
}

export function getModel(files: IntegrationFile[], grouping?: boolean): Model {
    const integrations = getIntegrations(files);
    const tins = TopologyUtils.findTopologyIncomingNodes(integrations);
    const troutes = TopologyUtils.findTopologyRouteNodes(integrations);
    const tons = TopologyUtils.findTopologyRouteOutgoingNodes(integrations);
    const trestns = TopologyUtils.findTopologyRestNodes(integrations);

    const trcs = TopologyUtils.findTopologyRouteConfigurationNodes(integrations);
    const trcons = TopologyUtils.findTopologyRouteConfigurationOutgoingNodes(integrations);

    const nodes: NodeModel[] = [];

    nodes.push(...getRestNodes(trestns))
    nodes.push(...getIncomingNodes(tins))
    nodes.push(...getRoutes(troutes))
    nodes.push(...getRouteConfigurations(trcs))
    nodes.push(...getOutgoingNodes(tons))
    nodes.push(...getOutgoingNodes(trcons))

    const edges: EdgeModel[] = [];
    edges.push(...getIncomingEdges(tins));
    edges.push(...getOutgoingEdges(tons));
    edges.push(...getRestEdges(trestns, tins));
    edges.push(...getInternalEdges(tons, tins));
    edges.push(...getInternalEdges(trcons, tins));


    // Groups
    const groups: NodeModel[] = [];
    if (grouping === true) {
        const children1: string[] = [];
        children1.push(...tins.filter(i => i.type === 'external').map(i => i.id));
        children1.push(...trestns.map(i => i.id));
        groups.push({
            id: 'consumer-group',
            children: children1,
            type: 'group',
            group: true,
            label: 'Consumer group',
            style: {
                padding: 20,
            }
        })

        const children2 = [...tons.filter(i => i.type === 'external').map(i => i.id)];
        groups.push({
            id: 'producer-group',
            children: children2,
            type: 'group',
            group: true,
            label: 'Producer group',
            style: {
                padding: 20,
            },
        })
    } else {
        const externalEdges = getExternalEdges(tons,tins);
        edges.push(...externalEdges);
        // const uniqueGroups: Map<string, string[]> = new Map();
        //
        // externalEdges.forEach(edge => {
        //     const groupName =  edge.data.groupName;
        //     const children = uniqueGroups.get(groupName) || [];
        //     if (edge.source) children.push(edge.source)
        //     if (edge.target) children.push(edge.target)
        //     uniqueGroups.set(groupName, [...new Set(children)]);
        // });
        //
        // uniqueGroups.forEach((children, groupName) => {
        //     groups.push({
        //         id: groupName + '-group',
        //         children: children,
        //         type: 'group',
        //         group: true,
        //         // label: edge.id + ' group',
        //         style: {
        //             padding: 20,
        //         }
        //     })
        // })
    }
    nodes.push(...groups)

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