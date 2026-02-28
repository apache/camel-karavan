import {BaseLayout, Graph, GRAPH_LAYOUT_END_EVENT, Layout, LayoutOptions, Node} from '@patternfly/react-topology';
import ELK, {ElkExtendedEdge, ElkNode} from 'elkjs/lib/elk.bundled';
import Point from "@patternfly/react-topology/src/geom/Point";
import Dimensions from "@patternfly/react-topology/src/geom/Dimensions";

// --- CONFIGURATION ---
const getRootOptions = (): any => {
    return {
        'elk.algorithm': 'layered',
        'elk.direction': 'DOWN',
        "elk.edgeRouting" : "ORTHOGONAL",
        "elk.separateConnectedComponents": "true",
        'elk.spacing.nodeNode': '75',
        'elk.spacing.edgeNode': '75',
        'elk.portConstraints': 'FREE',
        "elk.hierarchyHandling": "INCLUDE_CHILDREN",

        "elk.layered.thoroughness": "100",
        'elk.layered.nodePlacement.bk.fixedAlignment': 'BALANCED',
        'elk.layered.unnecessaryBendpoints': 'false',
        'elk.layered.spacing.edgeEdgeBetweenLayers': '20',
        // 'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
        'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
        "elk.layered.compaction.postCompaction.strategy": "EDGE_LENGTH",
        // "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
        // "elk.layered.crossingMinimization.greedySwitch.type": "TWO_SIDED",
        'elk.layered.spacing.nodeNodeBetweenLayers': '60',
        'elk.layered.spacing.edgeNodeBetweenLayers': '20',
        'elk.layered.cycleBreaking.strategy': 'GREEDY',
    };
};

const GROUP_OPTIONS = {
    'elk.padding': '[top=40,left=40,bottom=40,right=40]',
    'elk.portConstraints': 'FREE',
    "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    'elk.layered.layering.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
};

const NODE_OPTIONS = {
    'elk.portConstraints': 'FREE',
};

const EDGE_OPTIONS = {
    'elk.priority': '10',
    'elk.layered.priority.direction': '0',
    'elk.layered.priority.straightness': '2000',
    'elk.edgeRouting': 'ORTHOGONAL',
};


export class TopologyElkLayout extends BaseLayout implements Layout {
    private elk: InstanceType<typeof ELK>;

    constructor(graph: Graph, options?: Partial<LayoutOptions>) {
        super(graph, options);
        this.elk = new ELK();
    }

    protected startLayout(graph: Graph): void {
        const elkGraph = this.createElkGraph(graph);

        this.elk.layout(elkGraph)
            .then((layoutedGraph) => {
                this.applyLayout(layoutedGraph);
                // Optional: Update edge bend points if your PF version supports it
                // this.updateEdgeSegments(layoutedGraph, graph);

                graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph });
            })
            .catch((err) => console.error('ELK Layout Failed:', err));
    }

    // --- MAPPING INPUT ---

    private createElkGraph(graph: Graph): ElkNode {
        return {
            id: 'root',
            layoutOptions: getRootOptions(),
            children: graph.getNodes().map(node => this.mapNodeToElk(node)),
            edges: this.mapEdgesToElk(graph)
        };
    }

    private estimatedLabelWidth(text: string) {
        // ~7px per char + padding; adjust to your font
        return Math.min(120, Math.max(20, 64 + text.length * 7));
    }

    private mapNodeToElk(node: Node): ElkNode {
        const children = node.getNodes().sort((a, b) => Math.random() - 0.5);
        const isGroup = node.isGroup();
        const dims = node.getDimensions();

        const ICON_W = 75; // your circle/icon area

        const label = node.getLabel?.() ?? node.getId(); // however you get label
        const width = Math.max(ICON_W, this.estimatedLabelWidth(label));
        const height = Math.max(60, dims.height || 60);

        if (!isGroup) {
            return {
                id: node.getId(),
                width: width,
                height: height,
                layoutOptions: NODE_OPTIONS,
            };
        } else {
            return {
                id: node.getId(),
                children: children.map(child => this.mapNodeToElk(child)),
                layoutOptions: GROUP_OPTIONS
            };
        }
    }

    private mapEdgesToElk(graph: Graph): ElkExtendedEdge[] {
        // We map ALL edges at the root.
        // Since we use 'INCLUDE_CHILDREN', ELK handles the hierarchy routing automatically.
        return graph.getEdges().map(edge => {
            const s = edge.getSource().getId();
            const t = edge.getTarget().getId();
            return ({
                id: edge.getId(),
                sources: [`${s}`],
                targets: [`${t}`],
                layoutOptions: EDGE_OPTIONS,
            });
        });
    }

    // --- APPLYING OUTPUT ---

    private getNode(id: string): Node | undefined {
        // Helper to find node even if nested deep in groups
        return this.graph.getNodes().find(n => n.getId() === id)
            || this.graph.getNodes().flatMap(n => n.getNodes()).find(n => n.getId() === id);
    }

    private applyLayout(elkNode: ElkNode, parentX = 0, parentY = 0) {
        if (elkNode.id !== 'root') {
            const pfNode = this.getNode(elkNode.id);
            if (pfNode) {
                // ELK coordinates are relative to parent.
                // PF usually wants absolute, so we accumulate parent offsets.
                const absoluteX = (elkNode.x ?? 0) + parentX;
                const absoluteY = (elkNode.y ?? 0) + parentY;

                pfNode.setPosition(new Point(absoluteX, absoluteY));

                if (pfNode.isGroup() && elkNode.width && elkNode.height) {
                    pfNode.setDimensions(new Dimensions(elkNode.width, elkNode.height));
                }
            }
        }

        // Recurse with current node's absolute position as the new parent offset
        if (elkNode.children) {
            const currentX = (elkNode.id === 'root') ? 0 : (elkNode.x ?? 0) + parentX;
            const currentY = (elkNode.id === 'root') ? 0 : (elkNode.y ?? 0) + parentY;

            elkNode.children.forEach((child) => {
                this.applyLayout(child, currentX, currentY);
            });
        }
    }

    /**
     * Optional: ELK calculates complex routes to avoid nodes.
     * If we don't apply these bend points, the frontend just draws a straight line
     * between the new node positions, ignoring ELK's hard work.
     */
    private updateEdgeSegments(elkNode: ElkNode, graph: Graph) {
        const allElkEdges: ElkExtendedEdge[] = [];
        const collectEdges = (node: ElkNode) => {
            if (node.edges) allElkEdges.push(...node.edges);
            if (node.children) node.children.forEach(collectEdges);
        };
        collectEdges(elkNode);

        allElkEdges.forEach(elkEdge => {
            const pfEdge = graph.getEdges().find(e => e.getId() === elkEdge.id);
            if (!pfEdge || !elkEdge.sections || elkEdge.sections.length === 0) return;

            const section = elkEdge.sections[0];
            const bendPoints = section.bendPoints || [];

            if (bendPoints.length > 0) {
                // Check if these bendpoints actually create a deviation from a straight line
                // This prevents "jittery" lines that are 99% straight
                const start = section.startPoint;
                const end = section.endPoint;

                const isMeaningful = bendPoints.some(bp => {
                    const distToStraightLine = this.pointToLineDistance(bp, start, end);
                    return distToStraightLine > 2; // Threshold in pixels
                });

                if (isMeaningful) {
                    // Map ELK points to PatternFly Points
                    const bends = bendPoints.map(bp => new Point(bp.x, bp.y));
                    pfEdge.setBendpoints(bends);
                } else {
                    pfEdge.setBendpoints([]);
                }
            } else {
                pfEdge.setBendpoints([]);
            }
        });
    }

// Helper to detect if a bendpoint is just a point on a straight line
    private pointToLineDistance(p: {x: number, y: number}, a: {x: number, y: number}, b: {x: number, y: number}) {
        const numerator = Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x);
        const denominator = Math.sqrt(Math.pow(b.y - a.y, 2) + Math.pow(b.x - a.x, 2));
        return denominator === 0 ? 0 : numerator / denominator;
    }

    protected updateLayout(): void {}
    protected stopSimulation(): void {}
}