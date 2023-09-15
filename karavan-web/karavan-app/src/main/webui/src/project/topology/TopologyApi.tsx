import {
    ComponentFactory,
    DefaultEdge,
    DefaultGroup,
    EdgeModel,
    GraphComponent,
    Model,
    ModelKind,
    NodeModel,
    NodeShape,
    NodeStatus,
    withDragNode,
    withPanZoom
} from '@patternfly/react-topology';
import CustomNode from "./CustomNode";
import {ProjectFile} from "../../api/ProjectModels";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {TopologyUtils} from "karavan-core/lib/api/TopologyUtils";
import {TopologyIncomingNode, TopologyOutgoingNode, TopologyRouteNode} from "karavan-core/lib/model/TopologyDefinition";

const NODE_DIAMETER = 60;

export function getIntegrations(files: ProjectFile[]): Integration[] {
    return files.filter((file) => file.name.endsWith(".camel.yaml")).map((file) => {
        return CamelDefinitionYaml.yamlToIntegration(file.name, file.code);
    })
}

export function getIncomings(tins: TopologyIncomingNode[]): NodeModel[] {
    return tins.map(tin => {
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
            label: tin.title,
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

export function getOutgoings(tons: TopologyOutgoingNode[]): NodeModel[] {
    return tons.map(tin => {
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
    return tins.map(tin => {
        const node: EdgeModel = {
            id: 'edge-incoming-' + tin.routeId,
            type: 'edge',
            source: tin.id,
            target: 'route-' + tin.routeId
        }
        return node;
    });
}

export function getOutgoingEdges(tons: TopologyOutgoingNode[]): EdgeModel[] {
    return tons.map(tin => {
        const node: EdgeModel = {
            id: 'edge-outgoing-' + tin.routeId + '-' + (tin.step as any).id,
            type: 'edge',
            source: 'route-' + tin.routeId,
            target: tin.id
        }
        return node;
    });
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
        children.push(... tins.filter(i => i.routeId === r.routeId).map(i => i.id));
        children.push(... tons.filter(i => i.routeId === r.routeId).map(i => i.id));
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

    nodes.push(...getIncomings(tins))
    nodes.push(...getRoutes(troutes))
    nodes.push(...getOutgoings(tons))
    nodes.push(...groups)
    // nodes.push(...groups2)

    const edges: EdgeModel[] = [];
    edges.push(...getIncomingEdges(tins));
    edges.push(...getOutgoingEdges(tons));

    return {nodes: nodes, edges: edges, graph: {id: 'g1', type: 'graph', layout: 'Dagre'}};
}

export const customComponentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
    switch (type) {
        case 'group':
            return DefaultGroup;
        default:
            switch (kind) {
                case ModelKind.graph:
                    return withPanZoom()(GraphComponent);
                case ModelKind.node:
                    return withDragNode()(CustomNode);
                // return CustomNode;
                case ModelKind.edge:
                    return DefaultEdge;
                default:
                    return undefined;
            }
    }
}