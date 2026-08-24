import {BaseLayout, getGroupPadding, Graph, GRAPH_LAYOUT_END_EVENT, Layout, LayoutLink, LayoutNode, LayoutOptions} from "@patternfly/react-topology";
import {ForceSimulationNode} from "@patternfly/react-topology/src/layouts/ForceSimulation";

// BaseLayout defaults to no repulsion at all, which lets unrelated clusters settle on top of each
// other and drags their edges across the graph. These give the simulation room to separate them.
const CHARGE_STRENGTH = -350;
const COLLIDE_DISTANCE = 10;

// Extra link length per connection beyond the first, so the neighbours of a busy node fan out
// around it instead of folding over each other
const HUB_LINK_DISTANCE = 14;
const MAX_HUB_LINK_DISTANCE = 140;

export class ArchitectureForceLayout extends BaseLayout implements Layout {

    private degreeByNodeId = new Map<string, number>();

    constructor(graph: Graph, options?: Partial<LayoutOptions>) {
        super(graph, {
            chargeStrength: CHARGE_STRENGTH,
            collideDistance: COLLIDE_DISTANCE,
            ...options,
            layoutOnDrag: true,
            onSimulationEnd: () => {
                this.nodes.forEach((n) => n.setFixed(false));
                this.graph.getController().fireEvent(GRAPH_LAYOUT_END_EVENT, { graph: this.graph });
            }
        });
    }

    protected getLinkDistance = (e: LayoutLink | d3.SimulationLinkDatum<ForceSimulationNode>) => {
        // The busiest endpoint decides: a hub needs spokes long enough for its neighbours to spread
        const maxDegree = Math.max(this.getDegree(e.source?.id), this.getDegree(e.target?.id));
        const hubDistance = Math.min(MAX_HUB_LINK_DISTANCE, HUB_LINK_DISTANCE * Math.max(0, maxDegree - 1));

        let distance = this.options.linkDistance + hubDistance + e.source.radius * 1.3 + e.target.radius * 1.3;
        const isFalse = e instanceof LayoutLink && e.isFalse;
        if (!isFalse && e.source.element.getParent() !== e.target.element.getParent()) {
            // find the group padding
            distance += getGroupPadding(e.source.element.getParent());
            distance += getGroupPadding(e.target.element.getParent());
        }

        return distance;
    };

    /**
     * BaseLayout seeds every node on the exact centre of the graph, leaving the simulation to
     * untangle a start where nothing has a meaningful position - which is where most of the edge
     * crossings come from, since the winding it happens to resolve into is arbitrary. Seeding the
     * nodes around a circle in breadth first order instead puts neighbours side by side up front,
     * so the simulation only has to relax a layout that is already roughly untangled.
     */
    protected initializeNodePositions(nodes: LayoutNode[], graph: Graph, force: boolean): void {
        this.degreeByNodeId = this.getDegreeByNodeId();

        const unpositioned = nodes.filter(node => force || !node.element.isPositioned());
        const unpositionedIds = new Set(unpositioned.map(node => node.id));
        // Anything already placed stays where it is, as BaseLayout does
        nodes.filter(node => !unpositionedIds.has(node.id)).forEach(node => node.setFixed(true));
        if (unpositioned.length === 0) {
            return;
        }

        const {width, height} = graph.getBounds();
        const cx = width / 2;
        const cy = height / 2;
        const ordered = this.getBreadthFirstOrder(unpositioned);
        const radius = this.getSeedRadius(ordered);
        ordered.forEach((node, index) => {
            const angle = (2 * Math.PI * index) / ordered.length;
            node.setPosition(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
        });
    }

    /**
     * Walks each connected component breadth first, starting from its best connected node and
     * taking the best connected neighbours first, so that the neighbours of a node end up as a
     * contiguous run on the seed circle rather than as chords reaching across it.
     */
    private getBreadthFirstOrder(nodes: LayoutNode[]): LayoutNode[] {
        const nodeById = new Map(nodes.map(node => [node.id, node]));
        const neighbourIds = new Map<string, string[]>();

        function addNeighbour(nodeId?: string, neighbourId?: string) {
            if (nodeId === undefined || neighbourId === undefined) {
                return;
            }
            if (!neighbourIds.has(nodeId)) {
                neighbourIds.set(nodeId, []);
            }
            neighbourIds.get(nodeId)?.push(neighbourId);
        }

        this.edges.forEach(edge => {
            addNeighbour(edge.source?.id, edge.target?.id);
            addNeighbour(edge.target?.id, edge.source?.id);
        });

        // Id is the tie breaker so the same model always seeds identically
        const byDegree = (a: LayoutNode, b: LayoutNode) =>
            this.getDegree(b.id) - this.getDegree(a.id) || a.id.localeCompare(b.id);

        const visited = new Set<string>();
        const ordered: LayoutNode[] = [];
        [...nodes].sort(byDegree).forEach(start => {
            if (visited.has(start.id)) {
                return;
            }
            visited.add(start.id);
            const queue: LayoutNode[] = [start];
            while (queue.length > 0) {
                const node = queue.shift() as LayoutNode;
                ordered.push(node);
                (neighbourIds.get(node.id) ?? [])
                    .map(neighbourId => nodeById.get(neighbourId))
                    .filter((neighbour): neighbour is LayoutNode => neighbour !== undefined && !visited.has(neighbour.id))
                    .sort(byDegree)
                    .forEach(neighbour => {
                        visited.add(neighbour.id);
                        queue.push(neighbour);
                    });
            }
        });

        return ordered;
    }

    /** A circle wide enough to hold every node without them starting on top of each other */
    private getSeedRadius(nodes: LayoutNode[]): number {
        const maxRadius = nodes.reduce((max, node) => Math.max(max, node.radius), 0);
        const spacing = 2 * maxRadius + this.options.collideDistance + this.options.nodeDistance;
        return Math.max(spacing, (nodes.length * spacing) / (2 * Math.PI));
    }

    private getDegreeByNodeId(): Map<string, number> {
        const degrees = new Map<string, number>();
        const count = (nodeId?: string) => {
            if (nodeId !== undefined) {
                degrees.set(nodeId, (degrees.get(nodeId) ?? 0) + 1);
            }
        };
        this.edges.forEach(edge => {
            count(edge.source?.id);
            count(edge.target?.id);
        });
        return degrees;
    }

    private getDegree(nodeId?: string): number {
        return nodeId !== undefined ? this.degreeByNodeId.get(nodeId) ?? 0 : 0;
    }

    protected startLayout(graph: Graph): void {
        const { width, height } = graph.getBounds();
        const cx = width / 2;
        const cy = height / 2;
        this.forceSimulation.forceCenter(cx, cy);
        this.forceSimulation.alpha(1);
        this.forceSimulation.useForceSimulation(this.nodes, this.edges, this.getLinkDistance);
        this.forceSimulation.restart();
    }

    protected updateLayout(): void {
        this.forceSimulation.useForceSimulation(this.nodes, this.edges, this.getFixedNodeDistance);
        this.forceSimulation.alpha(0.2);
        this.forceSimulation.restart();
    }
}
