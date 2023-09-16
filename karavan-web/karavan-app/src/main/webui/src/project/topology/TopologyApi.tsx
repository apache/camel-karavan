import {
    ComponentFactory,
    DefaultEdge,
    EdgeAnimationSpeed,
    EdgeModel,
    EdgeStyle,
    GraphComponent,
    LabelPosition,
    Model,
    ModelKind,
    NodeModel,
    NodeShape,
    NodeStatus,
    withDragNode,
    withPanZoom, withSelection
} from '@patternfly/react-topology';
import CustomNode from "./CustomNode";
import {ProjectFile} from "../../api/ProjectModels";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {
    TopologyIncomingNode,
    TopologyOutgoingNode,
    TopologyRestNode,
    TopologyRouteNode
} from "karavan-core/lib/model/TopologyDefinition";
import CustomGroup from "./CustomGroup";
import CustomEdge from "./CustomEdge";

const NODE_DIAMETER = 60;

export function getIntegrations(files: ProjectFile[]): Integration[] {
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
                badge: tin.type,
                icon: 'element',
                step: tin.from,
            }
        }
    });
}

export function getRoutes(tins: TopologyRouteNode[]): NodeModel[] {
    return tins.map(tin => {
        const node: NodeModel = {
            id: tin.id,
            type: 'node',
            // label: tin.title,
            width: NODE_DIAMETER,
            height: NODE_DIAMETER,
            shape: NodeShape.rect,
            status: NodeStatus.default,
            data: {
                isAlternate: false,
                icon: 'route'
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
                step: tin.step,
                badge: tin.type
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

export function getRest(tins: TopologyRestNode[]): NodeModel[] {
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

export function getModel(files: ProjectFile[]): Model {
    const integrations = getIntegrations(files);
    const tins = TopologyUtils.findTopologyIncomingNodes(integrations);
    const troutes = TopologyUtils.findTopologyRouteNodes(integrations);
    const tons = TopologyUtils.findTopologyOutgoingNodes(integrations);
    const trestns = TopologyUtils.findTopologyRestNodes(integrations);

    const nodes: NodeModel[] = [];
    const groups: NodeModel[] = troutes.map(r => {
        const children = [r.id]
        children.push(... tins.filter(i => i.routeId === r.routeId && i.type === 'external').map(i => i.id));
        children.push(... tons.filter(i => i.routeId === r.routeId && i.type === 'external').map(i => i.id));
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

    nodes.push(...getRest(trestns))
    nodes.push(...getIncomingNodes(tins))
    nodes.push(...getRoutes(troutes))
    nodes.push(...getOutgoingNodes(tons))
    // nodes.push(...groups)

    const edges: EdgeModel[] = [];
    edges.push(...getIncomingEdges(tins));
    edges.push(...getOutgoingEdges(tons));
    edges.push(...getRestEdges(trestns, tins));
    edges.push(...getInternalEdges(tons, tins));

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
                    return withDragNode()(withSelection()(CustomNode));
                case ModelKind.edge:
                    return (withSelection()(CustomEdge));
                default:
                    return undefined;
            }
    }
}