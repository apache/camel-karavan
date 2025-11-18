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

import {EdgeAnimationSpeed, EdgeModel, EdgeStyle, Model, NodeModel, NodeShape, NodeStatus,} from '@patternfly/react-topology';
import {Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {
    TopologyAsyncApiNode,
    TopologyIncomingNode,
    TopologyOpenApiNode,
    TopologyOutgoingNode,
    TopologyRestNode,
    TopologyRouteConfigurationNode,
    TopologyRouteNode
} from "karavan-core/lib/model/TopologyDefinition";
import {INTERNAL_COMPONENTS} from "karavan-core/lib/api/ComponentApi";
import {EventBus} from "@/integration-designer/utils/EventBus";

const NODE_DIAMETER_ROUTE = 60;
const NODE_DIAMETER_INOUT = NODE_DIAMETER_ROUTE / 1.5;

export function getIntegrations(files: IntegrationFile[]): Integration[] {
    const integrations: Integration[] = [];
    files.filter((file) => file.name.endsWith(".camel.yaml")).forEach((file) => {
        try {
            const i = CamelDefinitionYaml.yamlToIntegration(file.name, file.code);
            integrations.push(i);
        } catch (e: any) {
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
                routeGroup: tin.route.group,
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
    const result: EdgeModel[] = [];
    tons.filter(ton => ton.type === 'external').forEach((ton, index, array) => {
        const uniqueUri = ton.uniqueUri;
        if (uniqueUri) {
            TopologyUtils.getIncomingNodeByUniqueUri(tins, uniqueUri).forEach(target => {
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

export function getUniqueUriNodes(tons: TopologyOutgoingNode[], tins: TopologyIncomingNode[], troutes: TopologyRouteNode[]): NodeModel[] {
    const result: Map<string, NodeModel> = new Map();

    tons.filter(ton => ton.type === 'external').forEach((ton, index, array) => {
        const uniqueUri = ton.uniqueUri;
        if (uniqueUri) {
            const node: NodeModel = result.get(uniqueUri) ?? {
                id: uniqueUri,
                type: 'node',
                label: '',
                width: NODE_DIAMETER_INOUT,
                height: NODE_DIAMETER_INOUT,
                shape: NodeShape.circle,
                status: NodeStatus.default,
                data: {
                    isAlternate: false,
                    icon: 'element',
                    type: 'step',
                    badge: ton.connectorType,
                    step: ton.step,
                    fileName: ton.fileName,
                    outgoing: true,
                    incomingIds: [],
                    outgoingIds: [],
                    groups: []
                }
            }
            node.data.outgoingIds = [...new Set([...node.data.outgoingIds, ton.routeId])];
            TopologyUtils.getIncomingNodeByUniqueUri(tins, uniqueUri).forEach(tin => {
                node.data.incomingIds = [...new Set([...node.data.incomingIds, tin.routeId])];
            })

            const groups: string[] = [];
            troutes.filter(r => (node.data.incomingIds.includes(r.routeId) || node.data.outgoingIds.includes(r.routeId)) && r.route.group).forEach(r => {
                if (r.route.group) groups.push(r.route.group)
            });
            node.data.groups = [...new Set(groups)];
            result.set(uniqueUri, node)
        }
    });
    tins.filter(tin => tin.type === 'external').forEach((tin, index, array) => {
        const uniqueUri = tin.uniqueUri;
        if (uniqueUri) {
            const node: NodeModel = result.get(uniqueUri) ?? {
                id: uniqueUri,
                type: 'node',
                label: '',
                width: NODE_DIAMETER_INOUT,
                height: NODE_DIAMETER_INOUT,
                shape: NodeShape.circle,
                status: NodeStatus.default,
                data: {
                    isAlternate: false,
                    icon: 'element',
                    type: 'step',
                    badge: tin.connectorType,
                    step: tin.from,
                    fileName: tin.fileName,
                    outgoing: false,
                    incomingIds: [],
                    outgoingIds: []
                }
            }
            node.data.incomingIds = [...new Set([...node.data.incomingIds, tin.routeId])];
            TopologyUtils.getOutgoingNodeByUniqueUri(tons, uniqueUri).forEach(ton => {
                node.data.outgoingIds = [...new Set([...node.data.outgoingIds, ton.routeId])];
            })
            const groups: string[] = [];
            troutes.filter(r => (node.data.incomingIds.includes(r.routeId) || node.data.outgoingIds.includes(r.routeId)) && r.route.group).forEach(r => {
                if (r.route.group) groups.push(r.route.group)
            });
            node.data.groups = [...new Set(groups)];
            result.set(uniqueUri, node)
        }
    });
    return Array.from(result.values());
}

export function getUriEdges(nodes: NodeModel[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    nodes.forEach(node => {
        node.data.incomingIds.forEach((tinRouteId: string) => {
            const edge: EdgeModel = {
                id: 'edge-uri-' + node.id + '-' + tinRouteId,
                type: 'edge',
                source: node.id,
                target: 'route-' + tinRouteId,
                edgeStyle: EdgeStyle.dashedMd,
                animationSpeed: EdgeAnimationSpeed.medium,
                data: {
                    label: node.id?.split(":")?.[0]
                }
            }
            result.push(edge);
        })
        node.data.outgoingIds.forEach((tonRouteId: string) => {
            const edge: EdgeModel = {
                id: 'edge-uri-' + node.id + '-' + tonRouteId,
                type: 'edge',
                source: 'route-' + tonRouteId,
                target: node.id,
                edgeStyle: EdgeStyle.dashedMd,
                animationSpeed: EdgeAnimationSpeed.medium,
                data: {
                    label: node.id?.split(":")?.[0]
                }
            }
            result.push(edge);
        })
    });
    return result;
}

export function getRestNodes(tins: TopologyRestNode[]): NodeModel[] {
    return tins.map(tin => {
        const isOpenApi = tin.rest.openApi !== undefined;
        return {
            id: tin.id,
            type: 'node',
            label: isOpenApi ? 'REST Config' : tin.title,
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

export function getOpenApiNodes(topenapis: TopologyOpenApiNode[]): NodeModel[] {
    return topenapis.map(topenapi => {
        return {
            id: topenapi.fileName,
            type: 'node',
            label: topenapi.title,
            width: NODE_DIAMETER_ROUTE,
            height: NODE_DIAMETER_ROUTE,
            shape: NodeShape.hexagon,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: 'OpenAPI',
                icon: 'openapi',
                type: 'openapi',
                // step: tin.rest,
                fileName: topenapi.fileName,
                secondaryLabel: topenapi.title,
            }
        }
    });
}
export function getAsyncApiNodes(tasyncapis: TopologyAsyncApiNode[]): NodeModel[] {
    return tasyncapis.map(tasyncapi => {
        return {
            id: tasyncapi.fileName,
            type: 'node',
            label: tasyncapi.title,
            width: NODE_DIAMETER_ROUTE,
            height: NODE_DIAMETER_ROUTE,
            shape: NodeShape.hexagon,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: 'AsyncAPI',
                icon: 'asyncapi',
                type: 'asyncapi',
                // step: tin.rest,
                fileName: tasyncapi.fileName,
                secondaryLabel: tasyncapi.title,
            }
        }
    });
}

export function getOpenApiEdges(topenapis: TopologyOpenApiNode[], tins: TopologyIncomingNode[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    topenapis.forEach(topenapi => {
        topenapi.operations.filter(o => o.operationId?.length > 0)
            .forEach((operation, index, array) => {
                const target = TopologyUtils.getRouteIdByUri(tins, 'direct:' + operation.operationId);
                const node: EdgeModel = {
                    id: 'incoming-' + operation.path + '-' + operation.method + '-' + index,
                    type: 'edge',
                    source: topenapi.fileName,
                    target: target,
                    edgeStyle: EdgeStyle.solid,
                    animationSpeed: EdgeAnimationSpeed.medium,
                    data: {
                        label: `${operation.method} ${operation.path} `
                    }
                }
                if (target) result.push(node);
            })
    });
    return result;
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

export function getSimpleModel(files: IntegrationFile[], showGroups: boolean, openApiJson?: string, asyncApiJson?: string): Model {
    return getModel(files, showGroups, (fileName: string) => {
    }, (fileName, elementId, disabled) => {
    }, (fileName, routeId) => {
    }, (fileName, routeId, groupName) => {
    }, openApiJson, asyncApiJson)
}

export function getModel(files: IntegrationFile[], showGroups: boolean,
                         selectFile: (fileName: string) => void,
                         setDisabled: (fileName: string, elementId: string, disabled: boolean) => void,
                         deleteRoute: (fileName: string, routeId: string) => void,
                         setRouteGroup: (fileName: string, routeId: string, groupName: string) => void,
                         openApiJson?: string, asyncApiJson?: string): Model {
    const integrations = getIntegrations(files);
    const tins = TopologyUtils.findTopologyIncomingNodes(integrations);
    const troutes = TopologyUtils.findTopologyRouteNodes(integrations);
    const tons = TopologyUtils.findTopologyRouteOutgoingNodes(integrations);
    const topenapis = openApiJson ? [TopologyUtils.findTopologyOpenApiNodes(openApiJson)] : [];
    const tasyncapis = asyncApiJson ? [TopologyUtils.findTopologyAsyncApiNodes(asyncApiJson)] : [];

    const trestns = TopologyUtils.findTopologyRestNodes(integrations) || [];

    const trcs = TopologyUtils.findTopologyRouteConfigurationNodes(integrations);
    const trcons = TopologyUtils.findTopologyRouteConfigurationOutgoingNodes(integrations);

    const nodes: NodeModel[] = [];

    nodes.push(...getRestNodes(trestns))
    nodes.push(...getOpenApiNodes(topenapis))
    nodes.push(...getAsyncApiNodes(tasyncapis))
    nodes.push(...getRoutes(troutes))
    nodes.push(...getRouteConfigurations(trcs))
    const uriNodes = getUniqueUriNodes(tons, tins, troutes);
    if (showGroups) {
        nodes.push(...getIncomingNodes(tins))
        nodes.push(...getOutgoingNodes(tons))
        nodes.push(...getOutgoingNodes(trcons))
    } else {
        nodes.push(...uriNodes);
    }

    const edges: EdgeModel[] = [];
    const uriEdges = getUriEdges(uriNodes);
    if (showGroups) {
        edges.push(...getIncomingEdges(tins));
        edges.push(...getOutgoingEdges(tons));
    } else {
        edges.push(...uriEdges);
    }
    edges.push(...getRestEdges(trestns, tins));
    edges.push(...getOpenApiEdges(topenapis, tins));
    edges.push(...getInternalEdges(tons, tins));
    edges.push(...getInternalEdges(trcons, tins));

    // Groups
    const externalEdges = getExternalEdges(tons, tins);
    const groups: NodeModel[] = [];
    if (showGroups) {
        const hasOpenApi = topenapis.length > 0;
        if (hasOpenApi) {
            const children3 = [
                ...topenapis.map(o => o.fileName),
                ...(trestns?.map(i => i.id) ?? [])
            ];
            groups.push({
                id: 'karavan-open-api-group',
                children: children3,
                type: 'group',
                group: true,
                label: 'OpenAPI group',
                style: {
                    padding: 20,
                },
            })
        }

        const children1 = [
            ...tins.filter(i => i.type === 'external').map(i => i.id),
            ...(!hasOpenApi ? trestns.map(i => i.id) : []),
        ];
        groups.push({
            id: 'karavan-consumer-group',
            children: children1,
            type: 'group',
            group: true,
            label: 'Consumers',
            style: {
                padding: 20,
            }
        })

        const children2 = [...tons.filter(i => i.type === 'external').map(i => i.id)];
        groups.push({
            id: 'karavan-producer-group',
            children: children2,
            type: 'group',
            group: true,
            label: 'Producers',
            style: {
                padding: 20,
            },
        })
    } else {
        // edges.push(...externalEdges);
    }

    if (showGroups) {
        const routeGroups: Map<string, string []> = new Map<string, string []>;
        troutes.forEach(troute => {
            if (troute.route.group && troute.route.group.trim().length > 0) {
                const groupName = troute.route.group.trim();
                const children = routeGroups.get(groupName) ?? [];
                children.push(troute.id)
                routeGroups.set(groupName, children);
            }
        })

        // uriNodes.filter(uriNode => uriNode.data.groups?.length === 1).forEach(uriNode => {
        //     const groupName = uriNode.data.groups[0];
        //     const children = routeGroups.get(groupName) ?? [];
        //     children.push(uriNode.id)
        //     routeGroups.set(groupName, children);
        // })

        routeGroups.keys().forEach(groupName => {
            groups.push({
                id: groupName,
                children: routeGroups.get(groupName) ?? [],
                type: 'group',
                group: true,
                label: groupName,
                style: {
                    padding: 20,
                },
            })
        })

        // const externalGroups:Map<string, string []> = new Map<string, string []>;
        // externalEdges.forEach(edge => {
        //     if (edge.source && edge.target) {
        //         const edgeName = edge.source + '-' + edge.target;
        //         const children = routeGroups.get(edgeName) ?? [];
        //         children.push(edge.source)
        //         children.push(edge.target)
        //         externalGroups.set(edgeName, children);
        //     }
        // })
        //
        // externalGroups.keys().forEach(groupName => {
        //     groups.push({
        //         id: groupName,
        //         children: externalGroups.get(groupName) ?? [],
        //         type: 'group',
        //         group: true,
        //         label: '',
        //         style: {
        //             padding: 20,
        //         },
        //     })
        // })
    }

    nodes.push(...groups)

    const nodesWithHook = nodes.map(node => {
        const data = node.data || {}
        data.selectFile = selectFile;
        data.setDisabled = setDisabled;
        data.deleteRoute = deleteRoute;
        data.setRouteGroup = setRouteGroup;
        node.data = data;
        return node;
    })

    return {nodes: nodesWithHook, edges: edges, graph: {id: 'graph', type: 'graph', layout: 'elements'}};
}
