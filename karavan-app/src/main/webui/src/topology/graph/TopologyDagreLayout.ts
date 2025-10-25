import {BaseLayout, Edge, Graph, GRAPH_LAYOUT_END_EVENT, Layout, LAYOUT_DEFAULTS, LayoutLink, LayoutNode, Node} from "@patternfly/react-topology";
import {LayoutOptions} from "@patternfly/react-topology/src/layouts/LayoutOptions";
import dagre from "@dagrejs/dagre";
import {DagreNode} from "@patternfly/react-topology/dist/esm/layouts/DagreNode";
import {LayoutGroup} from "@patternfly/react-topology/dist/esm/layouts/LayoutGroup";
import {BendpointConfig, TopologyLink} from "@/topology/graph/TopologyLink";
import {TopologyGroup} from "@/topology/graph/TopologyGroup";

export type DagreLayoutOptions = LayoutOptions & dagre.GraphLabel & { ignoreGroups?: boolean };

export class TopologyDagreLayout extends BaseLayout implements Layout {

    protected dagreOptions: DagreLayoutOptions;
    private bendpointConfig: BendpointConfig;

    constructor(graph: Graph, options?: Partial<DagreLayoutOptions>, straightEdges?: boolean) {
        super(graph, options);
        this.dagreOptions = {
            ...this.options,
            layoutOnDrag: false,
            marginx: 0,
            marginy: 0,
            rankdir: 'TB',
            ranker: "network-simplex",
            nodesep: 20,
            edgesep: 20,
            ranksep: 10,
            ...options
        };
        this.bendpointConfig = {
            avoidNodes: !straightEdges,
        };
    }

    protected createLayoutNode(node: Node, nodeDistance: number, index: number) {
        return new DagreNode(node, nodeDistance, index);
    }

    protected createLayoutLink(edge: Edge, source: LayoutNode, target: LayoutNode, isFalse: boolean): LayoutLink {
        return new TopologyLink(edge, source, target, isFalse, this.bendpointConfig);
    }

    protected createLayoutGroup(node: Node, padding: number, index: number): LayoutGroup {
        return new TopologyGroup(node, padding, index);
    }

    protected updateEdgeBendpoints(edges: TopologyLink[]): void {
        edges.forEach((edge) => {
            const link = edge as TopologyLink;
            link.updateBendpoints(edges);
        });
    }

    protected getFauxEdges(): LayoutLink[] {
        return [];
    }

    protected startLayout(graph: Graph, initialRun: boolean, addingNodes: boolean): void {
        if (initialRun || addingNodes) {
            const dagreGraph = new dagre.graphlib.Graph({ compound: true });
            const options = { ...this.dagreOptions };
            Object.keys(LAYOUT_DEFAULTS).forEach((key) => delete (options as any)[key]);
            dagreGraph.setGraph(options);

            if (!this.dagreOptions.ignoreGroups) {
                this.groups.forEach((group) => {
                    dagreGraph.setNode(group.id, group);
                    dagreGraph.setParent(group.id, group.element.getParent().getId());
                });
            }

            this.nodes?.forEach((node) => {
                const updateNode = (node as DagreNode).getUpdatableNode();
                dagreGraph.setNode(node.id, updateNode);
                if (!this.dagreOptions.ignoreGroups) {
                    dagreGraph.setParent(node.id, node.element.getParent().getId());
                }
            });

            this.edges?.forEach((dagreEdge) => {
                dagreGraph.setEdge(dagreEdge.source.id, dagreEdge.target.id, dagreEdge);
            });

            dagre.layout(dagreGraph);
            this.nodes.forEach((node) => {
                (node as DagreNode).updateToNode(dagreGraph.node(node.id));
            });

            this.updateEdgeBendpoints(this.edges as TopologyLink[]);
        }

        if (this.dagreOptions.layoutOnDrag) {
            this.forceSimulation.useForceSimulation(this.nodes, this.edges, this.getFixedNodeDistance);
        } else {
            this.graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph: this.graph });
        }
    }
}
