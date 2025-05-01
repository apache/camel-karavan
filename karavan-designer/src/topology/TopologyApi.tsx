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
    EdgeAnimationSpeed,
    EdgeModel,
    EdgeStyle,
    Model,
    NodeModel,
    NodeShape,
    NodeStatus,
} from '@patternfly/react-topology';
import {Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {
    TopologyIncomingNode,
    TopologyOutgoingNode,
    TopologyRestNode,
    TopologyRouteConfigurationNode,
    TopologyRouteNode
} from "karavan-core/lib/model/TopologyDefinition";
import {INTERNAL_COMPONENTS} from "karavan-core/lib/api/ComponentApi";
import {EventBus} from "../designer/utils/EventBus";

const NODE_DIAMETER_ROUTE = 60;
const NODE_DIAMETER_INOUT = NODE_DIAMETER_ROUTE / 1.5;

export function getIntegrations(files: IntegrationFile[]): Integration[] {
    const integrations: Integration[] = [];
    files.filter((file) => file.name.endsWith(".camel.yaml")).forEach((file) => {
        try {
            const i = CamelDefinitionYaml.yamlToIntegration(file.name, file.code);
            integrations.push(i);
        } catch (e: any){
            console.error(e);
            EventBus.sendAlert('Error', e?.message, 'danger');
        }
    })
    return integrations;
}

export function getIncomingNodes(tins: TopologyIncomingNode[]): NodeModel[] {
    return tins.filter(tin => tin.type === 'external').map(tin => {
        return {
            id: tin.id,
            type: 'node',
            label: tin.title,
            width: NODE_DIAMETER_INOUT,
            height: NODE_DIAMETER_INOUT,
            shape: NodeShape.ellipse,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: tin.connectorType,
                icon: 'element',
                type: 'step',
                step: tin.from,
                fileName: tin.fileName,
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
            width: NODE_DIAMETER_ROUTE,
            height: NODE_DIAMETER_ROUTE,
            shape: NodeShape.rect,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: tin.templateId !== undefined ? 'RT' : 'R',
                type: 'route',
                icon: 'route',
                step: tin.route,
                routeId: tin.routeId,
                fileName: tin.fileName,
                templateId: tin.templateId,
                templateTitle: tin.templateTitle,

                autoStartup: tin.route.autoStartup !== false
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
            width: NODE_DIAMETER_ROUTE,
            height: NODE_DIAMETER_ROUTE,
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
            width: NODE_DIAMETER_INOUT,
            height: NODE_DIAMETER_INOUT,
            shape: NodeShape.ellipse,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                icon: 'element',
                type: 'step',
                step: tin.step,
                badge: tin.connectorType,
                fileName: tin.fileName,
                outgoing: true,
                disabled: (tin.step as any)?.disabled || false
            }
        }
        return node;
    });
}

export function getIncomingEdges(tins: TopologyIncomingNode[]): EdgeModel[] {
    return tins.filter(tin => tin.type === 'external').map((tin, index, array) => {
        const node: EdgeModel = {
            id: 'edge-incoming-' + tin.routeId,
            type: 'edge',
            source: tin.id,
            target: 'route-' + tin.routeId,
            edgeStyle: tin.type === 'external' ? EdgeStyle.dashedMd : EdgeStyle.solid,
            animationSpeed: tin.type === 'external' ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none,
            data: {
                label: tin.from.uri
            }
        }
        return node;
    });
}

export function getOutgoingEdges(tons: TopologyOutgoingNode[]): EdgeModel[] {
    return tons.filter(ton => ton.type === 'external').map((ton, index, array) => {
        const node: EdgeModel = {
            id: 'edge-outgoing-' + ton.routeId + '-' + (ton.step as any).id,
            type: 'edge',
            source: 'route-' + ton.routeId,
            target: ton.id,
            edgeStyle: ton.type === 'external' ? EdgeStyle.dashedMd : EdgeStyle.solid,
            animationSpeed: ton.type === 'external' ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none,
            data: {
                label: ton.uniqueUri?.split(":")?.[0]
            }
        }
        return node;
    });
}

export function getExternalEdges(tons: TopologyOutgoingNode[], tins: TopologyIncomingNode[]): EdgeModel[] {
    const result: EdgeModel[]= [];
    tons.filter(ton => ton.type === 'external').forEach((ton, index, array) => {
        const uniqueUri = ton.uniqueUri;
        if (uniqueUri) {
            TopologyUtils.getNodeIdByUniqueUri(tins, uniqueUri).forEach(target => {
                const node: EdgeModel = {
                    id: 'external-' + ton.id + '-' + target,
                    type: 'edge',
                    source: ton.id,
                    target: target.id,
                    edgeStyle: EdgeStyle.dotted,
                    animationSpeed: EdgeAnimationSpeed.medium,
                    data: {
                        groupName: uniqueUri,
                        label: target.from.uri
                    }
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
            width: NODE_DIAMETER_ROUTE,
            height: NODE_DIAMETER_ROUTE,
            shape: NodeShape.hexagon,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: 'API',
                icon: 'rest',
                type: 'rest',
                step: tin.rest,
                fileName: tin.fileName,
                secondaryLabel: tin.title,

            }
        }
    });
}

export function getRestEdges(rest: TopologyRestNode[], tins: TopologyIncomingNode[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    rest.forEach(tin => {
        tin.uris.forEach((uri, index, array) => {
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
    tons.filter(ton => ton.type === 'internal').forEach((ton, index, array) => {
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
                animationSpeed: EdgeAnimationSpeed.medium,
                data: {
                    endTerminalStatus: NodeStatus.danger,
                    label: 'onError'
                }
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
                    animationSpeed: EdgeAnimationSpeed.medium,
                    data: {
                        label: uri
                    }
                }
                if (target) result.push(node);
            }
        }
    });
    return result;
}

export function getSimpleModel(files: IntegrationFile[], grouping: boolean): Model {
    return getModel(files, grouping, (fileName: string) => {}, (fileName, elementId, disabled) => {})
}

export function getModel(files: IntegrationFile[], grouping: boolean,
                         selectFile: (fileName: string) => void,
                         setDisabled:(fileName: string, elementId: string, disabled: boolean) => void): Model {
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
    }
    nodes.push(...groups)

    const nodesWithHook = nodes.map(node => {
        const data = node.data || {}
        data.selectFile = selectFile;
        data.setDisabled = setDisabled;
        node.data = data;
        return node;
    })

    return {nodes: nodesWithHook, edges: edges, graph: {id: 'graph', type: 'graph', layout: 'elements'}};
}
