import {EdgeAnimationSpeed, EdgeModel, EdgeStyle, NodeModel, NodeShape, NodeStatus,} from '@patternfly/react-topology';
import {Integration, IntegrationFile} from "@core/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "@core/api/CamelDefinitionYaml";
import {TopologyUtils} from "@core/api/TopologyUtils";
import {
    TopologyAsyncApiNode,
    TopologyBeanNode,
    TopologyIncomingNode,
    TopologyOpenApiNode,
    TopologyOutgoingNode,
    TopologyRestNode,
    TopologyRouteConfigurationNode,
    TopologyRouteNode
} from "@core/model/TopologyDefinition";
import {INTERNAL_COMPONENTS} from "@core/api/ComponentApi";
import {EventBus} from "@designer/utils/EventBus";
import {ProjectPageSideBarType} from "../ProjectPageStore";
import {compareUri} from "@core/api/UriUtil";
import {useProjectStore} from "@stores/ProjectStore";
import {ProjectFile} from "@models/ProjectModels";

export const NODE_DIAMETER_ROUTE = 60;
export const NODE_DIAMETER_INOUT = NODE_DIAMETER_ROUTE / 1.5;
export const NODE_DIAMETER_BEAN = NODE_DIAMETER_ROUTE / 1.5;

function simplifyUriStringForLabel(input: string): string {
// Find where the prefix ends and the query string begins
    const lastColonIndex = input.lastIndexOf(':');

    // If there's no colon, return the original string (or handle as needed)
    if (lastColonIndex === -1) {
        return input;
    }

    // Extract the prefix (e.g., "xxx:xxxx:") and the query string (e.g., "ssss=aaaa&www=rrr&ttt=yyy")
    const prefix = input.substring(0, lastColonIndex + 1);
    const queryPart = input.substring(lastColonIndex + 1);

    // Extract just the values from the query part
    const values = queryPart.split('&').map(pair => {
        const equalIndex = pair.indexOf('=');
        // If there is an '=', return everything after it. Otherwise, return the whole chunk.
        return equalIndex !== -1 ? pair.substring(equalIndex + 1) : pair;
    });

    // Recombine the prefix with the new values joined by '&'
    return `${prefix}${values.join('&')}`;
}

export function getIntegrations(files: IntegrationFile[]): Integration[] {
    const integrations: Integration[] = [];
    files?.filter((file) => file.name.endsWith(".camel.yaml")).forEach((file) => {
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
    return tins?.filter(tin => tin.type === 'external').map(tin => {
        return {
            id: tin.id,
            type: 'node',
            label: TopologyUtils.getUriLabel(tin.uniqueUri),
            width: NODE_DIAMETER_INOUT,
            height: NODE_DIAMETER_INOUT,
            shape: NodeShape.circle,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: tin.connectorType,
                icon: 'element',
                type: 'step',
                step: tin.from,
                fileName: tin.fileName,
                state: getConsumerState(tin.routeId)
            }
        }
    });
}

export function getRouteStatuses(): string {
    const camelStatuses = useProjectStore.getState().camelStatuses;
    const route = camelStatuses[0]?.statuses.find(s => s.name === 'route');
    const statusText = route?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const routes = status?.route?.routes;
    if (routes !== undefined && Array.isArray(routes)) {
        return routes.map(r => r.routeId + ":" + r.state).join(',');
    } else {
        return "";
    }
}

function getRouteStatus(routeId: string): string {
    const camelStatuses = useProjectStore.getState().camelStatuses;
    const route = camelStatuses[0]?.statuses.find(s => s.name === 'route');
    const statusText = route?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const routes = status?.route?.routes;
    if (routes !== undefined && Array.isArray(routes)) {
        return routes.find(r => r.routeId === routeId)?.state ?? undefined;
    } else {
        return undefined;
    }
}

function getEdgeState(routeId1: string, routeId2: string): string {
    // 1. Fetch the individual statuses
    const statusA = getRouteStatus(routeId1);
    const statusB = getRouteStatus(routeId2);
    // 2. Determine edgeState using priority rules
    let edgeState = '';
    if (statusA === 'Stopped' || statusB === 'Stopped') {
        edgeState = 'Stopped';
    } else if (statusA === 'Suspended' || statusB === 'Suspended') {
        edgeState = 'Suspended';
    } else if (statusA === 'Started' && statusB === 'Started') {
        edgeState = 'Started';
    }
    return edgeState;
}

function getIncomingEdgeState(routeId: string): string {
    const statusConsumer = getConsumerState(routeId);
    const statusRoute = getRouteStatus(routeId);
    let edgeState = '';
    if (statusConsumer === 'Stopped' || statusRoute === 'Stopped') {
        edgeState = 'Stopped';
    } else if (statusConsumer === 'Suspended' || statusRoute === 'Suspended') {
        edgeState = 'Suspended';
    } else if (statusConsumer === 'Started' && statusRoute === 'Started') {
        edgeState = 'Started';
    }
    return edgeState;
}

function getOutgoingEdgeState(routeId: string, id: string): string {
    const statusProcessor = getProcessorState(routeId, id);
    const statusRoute = getRouteStatus(routeId);
    let edgeState = '';
    if (statusProcessor === 'Stopped' || statusRoute === 'Stopped') {
        edgeState = 'Stopped';
    } else if (statusProcessor === 'Suspended' || statusRoute === 'Suspended') {
        edgeState = 'Suspended';
    } else if (statusProcessor === 'Started' && statusRoute === 'Started') {
        edgeState = 'Started';
    }
    return edgeState;
}

function getProcessorState(routeId: string, id: string): string {
    const camelStatuses = useProjectStore.getState().camelStatuses;
    const processor = camelStatuses[0]?.statuses.find(s => s.name === 'processor');
    const statusText = processor?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const processors = status?.processor?.processors;
    if (processors !== undefined && Array.isArray(processors)) {
        return processors.find(p => p.id === routeId?.concat(id))?.state ?? undefined;
    } else {
        return undefined;
    }
}

function getConsumerState(routeId: string): string {
    const camelStatuses = useProjectStore.getState().camelStatuses;
    const consumer = camelStatuses[0]?.statuses.find(s => s.name === 'consumer');
    const statusText = consumer?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const consumers = status?.consumer?.consumers;
    if (consumers !== undefined && Array.isArray(consumers)) {
        return consumers.find(c => c.id === routeId)?.state ?? undefined;
    } else {
        return undefined;
    }
}

export function getRoutes(tins: TopologyRouteNode[], showStats?: boolean, jsonSchemas?: string[]): NodeModel[] {
    return tins.map(tin => {
        const badge = tin.isTemplated && tin.templateId !== undefined
            ? 'TR'
            : !tin.isTemplated && tin.templateId !== undefined ? 'RT' : 'R';

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
                badge: badge,
                type: 'route',
                icon: 'route',
                step: tin.route,
                routeId: tin.routeId,
                state: getRouteStatus(tin.routeId),
                routeGroup: tin.route.group,
                fileName: tin.fileName,
                templateId: tin.templateId,
                templateTitle: tin.templateTitle,
                autoStartup: tin.route.autoStartup !== false,
                showStats: showStats,
            }
        }
        return node;
    });
}

export function getBeanNodes(beans: TopologyBeanNode[]): NodeModel[] {
    return beans.map(bean => {
        const badge = 'BEAN';
        const node: NodeModel = {
            id: bean.id,
            type: 'node',
            label: bean.name,
            width: NODE_DIAMETER_BEAN,
            height: NODE_DIAMETER_BEAN,
            shape: NodeShape.circle,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                badge: badge,
                type: 'route',
                icon: bean.id?.split('-')?.at(0) ?? 'bean',
                routeGroup: "Beans",
                fileName: bean.fileName,
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
            width: NODE_DIAMETER_INOUT,
            height: NODE_DIAMETER_INOUT,
            shape: NodeShape.octagon,
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
    return tons?.filter(tin => tin.type === 'external').map(tin => {
        const node: NodeModel = {
            id: tin.id,
            type: 'node',
            label: TopologyUtils.getUriLabel(tin.uniqueUri),
            width: NODE_DIAMETER_INOUT,
            height: NODE_DIAMETER_INOUT,
            shape: NodeShape.circle,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                icon: 'element',
                type: 'step',
                step: tin.step,
                badge: tin.connectorType,
                fileName: tin.fileName,
                outgoing: true,
                disabled: (tin.step as any)?.disabled || false,
                state: getProcessorState(tin.routeId, (tin.step as any)?.id)
            }
        }
        return node;
    });
}

export function getIncomingEdges(tins: TopologyIncomingNode[]): EdgeModel[] {
    return tins?.filter(tin => tin.type === 'external').map((tin, index, array) => {
        const state = getIncomingEdgeState(tin.routeId);
        const node: EdgeModel = {
            id: 'edge-incoming-' + tin.routeId,
            type: 'edge',
            source: tin.id,
            target: 'route-' + tin.routeId,
            edgeStyle: tin.type === 'external' ? EdgeStyle.dashedMd : EdgeStyle.solid,
            animationSpeed: tin.type === 'external' && state === 'Started' ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none,
            data: {
                label: simplifyUriStringForLabel(tin.uniqueUri),
                state: state
            }
        }
        return node;
    });
}

export function getOutgoingEdges(tons: TopologyOutgoingNode[]): EdgeModel[] {
    return tons?.filter(ton => ton.type === 'external').map((ton, index, array) => {
        const state = getOutgoingEdgeState(ton.routeId, (ton.step as any)?.id);
        const node: EdgeModel = {
            id: 'edge-outgoing-' + ton.routeId + '-' + (ton.step as any).id,
            type: 'edge',
            source: 'route-' + ton.routeId,
            target: ton.id,
            edgeStyle: ton.type === 'external' ? EdgeStyle.dashedMd : EdgeStyle.solid,
            animationSpeed: ton.type === 'external' && state === 'Started' ? EdgeAnimationSpeed.medium : EdgeAnimationSpeed.none,
            data: {
                label: simplifyUriStringForLabel(ton.uniqueUri),
                state: state
            }
        }
        return node;
    });
}

export function getExternalEdges(tons: TopologyOutgoingNode[], tins: TopologyIncomingNode[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    tons?.filter(ton => ton.type === 'external').forEach((ton, index, array) => {
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
                        label: simplifyUriStringForLabel(target.from.uri)
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

    tons?.filter(ton => ton.type === 'external').forEach((ton, index, array) => {
        const uniqueUri = ton.uniqueUri;
        if (uniqueUri) {
            const node: NodeModel = result.get(uniqueUri) ?? {
                id: uniqueUri,
                type: 'node',
                label: TopologyUtils.getUriLabel(uniqueUri),
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
                    uniqueUri: uniqueUri,
                    outgoing: true,
                    incomingIds: [],
                    outgoingIds: [],
                    groups: [],
                    state: getProcessorState(ton.routeId, (ton.step as any)?.id)
                }
            }
            node.data.outgoingIds = [...new Set([...node.data.outgoingIds, ton.routeId])];
            TopologyUtils.getIncomingNodeByUniqueUri(tins, uniqueUri).forEach(tin => {
                node.data.incomingIds = [...new Set([...node.data.incomingIds, tin.routeId])];
            })

            const groups: string[] = [];
            troutes?.filter(r => (node.data.incomingIds.includes(r.routeId) || node.data.outgoingIds.includes(r.routeId)) && r.route.group).forEach(r => {
                if (r.route.group) groups.push(r.route.group)
            });
            node.data.groups = [...new Set(groups)];
            result.set(uniqueUri, node)
        }
    });
    tins?.filter(tin => tin.type === 'external').forEach((tin, index, array) => {
        const uniqueUri = tin.uniqueUri;
        if (uniqueUri) {
            const node: NodeModel = result.get(uniqueUri) ?? {
                id: uniqueUri,
                type: 'node',
                label: TopologyUtils.getUriLabel(uniqueUri),
                width: NODE_DIAMETER_INOUT,
                height: NODE_DIAMETER_INOUT,
                shape: NodeShape.circle,
                status: NodeStatus.default,
                data: {
                    uniqueUri: uniqueUri,
                    isAlternate: false,
                    icon: 'element',
                    type: 'step',
                    badge: tin.connectorType,
                    step: tin.from,
                    fileName: tin.fileName,
                    outgoing: false,
                    incomingIds: [],
                    outgoingIds: [],
                    state: getProcessorState(tin.routeId, (tin.from as any)?.id)
                }
            }
            node.data.incomingIds = [...new Set([...node.data.incomingIds, tin.routeId])];
            TopologyUtils.getOutgoingNodeByUniqueUri(tons, uniqueUri).forEach(ton => {
                node.data.outgoingIds = [...new Set([...node.data.outgoingIds, ton.routeId])];
            })
            const groups: string[] = [];
            troutes?.filter(r => (node.data.incomingIds.includes(r.routeId) || node.data.outgoingIds.includes(r.routeId)) && r.route.group).forEach(r => {
                if (r.route.group) groups.push(r.route.group)
            });
            node.data.groups = [...new Set(groups)];
            result.set(uniqueUri, node)
        }
    });
    return Array.from(result.values());
}

export function getWildCardUriEdges(nodes: NodeModel[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    const consumers = nodes?.filter(n => n.data?.outgoingIds?.length === 0);
    const producers = nodes?.filter(n => n.data?.incomingIds?.length === 0);
    consumers?.forEach(consumer => {
        producers?.filter(p => compareUri(p.id, consumer.id)).forEach(producer => {
            const edge: EdgeModel = {
                id: 'edge-wildcard-uri-' + producer.id + '-' + consumer.id,
                type: 'edge',
                source: producer.id,
                target: consumer.id,
                edgeStyle: EdgeStyle.dotted,
                animationSpeed: EdgeAnimationSpeed.medium,
                data: {
                }
            }
            result.push(edge);
        })
    })
    return result;
}

export function getUriEdges(nodes: NodeModel[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    nodes.forEach(node => {
        node.data.incomingIds.forEach((tinRouteId: string) => {
            const source = node.id;
            const target = 'route-' + tinRouteId;
            const edge: EdgeModel = {
                id: 'edge-uri-' + source + '_' + target,
                type: 'edge',
                source: source,
                target: target,
                edgeStyle: EdgeStyle.dashedMd,
                animationSpeed: EdgeAnimationSpeed.medium,
                data: {
                    label: simplifyUriStringForLabel(source)
                }
            }
            result.push(edge);
        })
        node.data.outgoingIds.forEach((tonRouteId: string) => {
            const source = 'route-' + tonRouteId;
            const target = node.id;
            const edge: EdgeModel = {
                id: 'edge-uri-' + source + '_' + target,
                type: 'edge',
                source: source,
                target: target,
                edgeStyle: EdgeStyle.dashedMd,
                animationSpeed: EdgeAnimationSpeed.medium,
                data: {
                    label: simplifyUriStringForLabel(target)
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

export function getOpenApiNodes(topenapis: TopologyOpenApiNode[], showStats?: boolean): NodeModel[] {
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
                showStats: showStats,
            }
        }
    });
}

export function getAsyncApiNodes(tasyncapis: TopologyAsyncApiNode[]): NodeModel[] {
    const result: NodeModel[] = [];
    tasyncapis.forEach(tasyncapi => {
        // const node = {
        //     id: tasyncapi.fileName,
        //     type: 'node',
        //     label: tasyncapi.title,
        //     width: NODE_DIAMETER_ROUTE,
        //     height: NODE_DIAMETER_ROUTE,
        //     shape: NodeShape.circle,
        //     status: NodeStatus.default,
        //     data: {
        //         isAlternate: false,
        //         badge: 'AsyncAPI',
        //         icon: 'asyncapi',
        //         type: 'asyncapi',
        //         // step: tin.rest,
        //         fileName: tasyncapi.fileName,
        //         secondaryLabel: tasyncapi.title,
        //     }
        // } as NodeModel;
        // result.push(node);

        tasyncapi.operations.forEach(operation => {
            const operationNode = {
                id: `asyncapi-operation-${operation.operationId}`,
                type: 'node',
                label: operation.operationId,
                width: NODE_DIAMETER_ROUTE,
                height: NODE_DIAMETER_ROUTE,
                shape: NodeShape.rect,
                status: NodeStatus.default,
                data: {
                    isAlternate: false,
                    badge: 'AsyncAPI',
                    type: operation.action,
                    icon: operation.action,
                    // step: tin.rest,
                    fileName: tasyncapi.fileName,
                    secondaryLabel: tasyncapi.title,
                }
            } as NodeModel;
            result.push(operationNode);
        })
    });
    return result;
}

export function getAsyncApiEdges(tasyncapis: TopologyAsyncApiNode[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    tasyncapis.forEach(tasyncapi => {
        tasyncapi.operations.forEach(operation => {
            const edge: EdgeModel = {
                id: `${operation.action}-${operation.operationId}`,
                type: 'edge',
                source: operation.action === 'send' ? `asyncapi-operation-${operation.operationId}` : tasyncapi.fileName,
                target: operation.action === 'send' ? tasyncapi.fileName : `asyncapi-operation-${operation.operationId}`,
                edgeStyle: EdgeStyle.dashed,
                animationSpeed: EdgeAnimationSpeed.medium,
                data: {
                    label: `${operation.action}`
                }
            }
            // result.push(edge);
        })
    });
    return result;
}

export function getOpenApiEdges(topenapis: TopologyOpenApiNode[], tins: TopologyIncomingNode[], trcs: TopologyRestNode[]): EdgeModel[] {
    const result: EdgeModel[] = [];
    topenapis.forEach(topenapi => {

        trcs?.filter(t => t.rest?.openApi !== undefined).forEach(trc => {
            const edgeRest: EdgeModel = {
                id: 'rest-openapi-' + topenapi.fileName + '-' + trc.id,
                type: 'edge',
                source: trc.id,
                target: topenapi.fileName,
                edgeStyle: EdgeStyle.solid,
                animationSpeed: EdgeAnimationSpeed.none
            }
            result.push(edgeRest);
        })

        topenapi.operations?.filter(o => o.operationId?.length > 0)
            .forEach((operation, index, array) => {
                const target = TopologyUtils.getRouteIdByUri(tins, 'direct:' + operation.operationId);
                const edge: EdgeModel = {
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
                if (target) result.push(edge);
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
    tons?.filter(ton => ton.type === 'internal').forEach((ton, index, array) => {
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
            const uri: string = step.uri;
            const component = uri?.split(":")?.[0];
            const name = step.parameters.name || step.parameters.address;
            if (INTERNAL_COMPONENTS.includes(component)) {
                const target = TopologyUtils.getRouteIdByUriAndName(tins, uri, name);
                const targetRouteId = target?.replace('route-', "");
                const node: EdgeModel = {
                    id: 'internal-' + ton.id + '-' + index,
                    type: 'edge',
                    source: 'route-' + ton.routeId,
                    target: target,
                    edgeStyle: EdgeStyle.solid,
                    animationSpeed: EdgeAnimationSpeed.medium,
                    data: {
                        label: uri,
                        edgeState: getEdgeState(ton.routeId, targetRouteId)
                    }
                }
                if (target) result.push(node);
            }
        }
    });
    return result;
}


export interface ModelActions {
    selectFile: (fileName: string) => void;
    setDisabled: (fileName: string, elementId: string, disabled: boolean) => void;
    deleteRoute: (fileName: string, routeId: string) => void;
    setRouteGroup: (fileName: string, routeId: string, groupName: string) => void;
    showSideBar: (showSideBar: ProjectPageSideBarType, selectedId: string, title: string) => void;
}

export function getModel(allFiles: ProjectFile[],
                         files: IntegrationFile[],
                         showGroups: boolean,
                         actions: ModelActions,
                         openApiJson?: string,
                         showStats?: boolean,
                         jsonSchemas?: string[],
                         showRouteTemplates?: boolean
) {
    const nodes: NodeModel[] = [];
    const edges: EdgeModel[] = [];

    try {
        const integrations = getIntegrations(files);
        const troutes = TopologyUtils.findTopologyRouteNodes(integrations);
        const routes = troutes?.filter(t => t.templateId === undefined);
        const routeTemplates = troutes?.filter(t => t.templateId !== undefined);
        const templatedRoutes = TopologyUtils.findTopologyTemplatedRouteNodes(integrations, routeTemplates);
        const allRoutes = showRouteTemplates
            ? [...routes, ...routeTemplates, ...templatedRoutes]
            : [...routes, ...templatedRoutes];
        const tins: any[] = TopologyUtils.findTopologyRoutesIncomingNodes(allRoutes);
        const allTons: any[] = TopologyUtils.findTopologyRoutesOutgoingNodes(allRoutes);
        const tons: any[] = allTons;
        const topenapis = openApiJson ? [TopologyUtils.findTopologyOpenApiNodes(openApiJson)] : [];

        const trestns = TopologyUtils.findTopologyRestNodes(integrations) || [];

        const trcs = TopologyUtils.findTopologyRouteConfigurationNodes(integrations);
        const trcons = TopologyUtils.findTopologyRouteConfigurationOutgoingNodes(integrations);

        nodes.push(...getRestNodes(trestns))
        nodes.push(...getOpenApiNodes(topenapis, showStats))
        nodes.push(...getRoutes(allRoutes, showStats, jsonSchemas))
        nodes.push(...getRouteConfigurations(trcs))
        const uriNodes = getUniqueUriNodes(tons, tins, allRoutes);
        if (showGroups) {
            nodes.push(...getIncomingNodes(tins))
            nodes.push(...getOutgoingNodes(tons))
            nodes.push(...getOutgoingNodes(trcons))
        } else {
            nodes.push(...uriNodes);
        }

        const uriEdges = getUriEdges(uriNodes);
        const wildCardUriEdges = getWildCardUriEdges(uriNodes);
        if (showGroups) {
            edges.push(...getIncomingEdges(tins));
            edges.push(...getOutgoingEdges(tons));
        } else {
            edges.push(...uriEdges);
            edges.push(...wildCardUriEdges);
        }
        edges.push(...getRestEdges(trestns, tins));
        edges.push(...getOpenApiEdges(topenapis, tins, trestns));
        // edges.push(...getAsyncApiEdges(tasyncapis));
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

            const asyncReceive: string[] = [];
            const asyncSend: string[] = [];
            // tasyncapis.forEach((asyn, i) => {
            //     asyn.operations.forEach((operation) => {
            //         if (operation.action === "send") {
            //             asyncSend.push(`asyncapi-operation-${operation.operationId}`);
            //         } else {
            //             asyncReceive.push(`asyncapi-operation-${operation.operationId}`);
            //         }
            //     })
            // });

            const children1 = [
                ...asyncReceive,
                ...tins?.filter(i => i.type === 'external').map(i => i.id),
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

            const children2 = [
                ...asyncSend,
                ...tons?.filter(i => i.type === 'external').map(i => i.id)
            ];
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
            // if (showBeans) {
            //     groups.push({
            //         id: 'karavan-beans',
            //         children: camelBeans?.map(bean => bean.id) || [],
            //         type: 'group',
            //         group: true,
            //         label: 'Beans',
            //         style: {
            //             padding: 20,
            //         },
            //     })
            //     groups.push({
            //         id: 'karavan-java',
            //         children: javaClasses?.map(bean => bean.id) || [],
            //         type: 'group',
            //         group: true,
            //         label: 'Java',
            //         style: {
            //             padding: 20,
            //         },
            //     })
            // }

        } else {
            // edges.push(...externalEdges);
        }

        if (showGroups) {
            const routeGroups: Map<string, string []> = new Map<string, string []>;
            allRoutes.forEach(troute => {
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
        }

        nodes.push(...groups)

    } catch (err) {
        console.error(err);
    }

    const nodesWithHook = nodes.map(node => {
        const data = node.data || {}
        data.actions = actions;
        node.data = data;
        return node;
    })

    return {nodes: nodesWithHook, edges: edges, graph: {id: 'graph', type: 'graph', layout: 'elements'}};
}
