import {action, LayoutLink, Point} from "@patternfly/react-topology";

export interface BendpointConfig {
    maxBendpoints?: number;
    avoidNodes?: boolean;
    bendpointSpacing?: number;
}

export class TopologyLink extends LayoutLink {
    private config: BendpointConfig;
    public points?: { x: number; y: number }[];
    
    constructor(element: any, source: any, target: any, isFalse: boolean, config: BendpointConfig = {}) {
        super(element, source, target, isFalse);
        this.config = {
            maxBendpoints: 8,
            avoidNodes: true,
            bendpointSpacing: 5,
            ...config
        };
    }

    updateBendpoints(edges: LayoutLink []): void {
        if (this.points && !this.isFalse && this.points.length > 2) {
            // this.element.setBendpoints(this.points.slice(1, -1).map((point: any) => new Point(point.x, point.y)));
            if (!this.config.avoidNodes) {
                action(() => this.element.setBendpoints([]))();
                return;
            }
            const bendpoints = this.calculateNodeAvoidingBendpoints(edges);
            action(() => this.element.setBendpoints(bendpoints))();
        }
    }

    private calculateNodeAvoidingBendpoints(edges: LayoutLink []): Point[] {
        const sourcePoint = this.source.element.getBounds().getCenter();
        const targetPoint = this.target.element.getBounds().getCenter();
        
        // Simple orthogonal routing to avoid nodes
        const bendpoints: Point[] = [];
        const maxBendpoints = this.config.maxBendpoints || 4;
        
        if (maxBendpoints > 0) {
            const dx = targetPoint.x - sourcePoint.x;
            const dy = targetPoint.y - sourcePoint.y;
            
            // Create orthogonal path with up to maxBendpoints
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal-first routing
                const midX = sourcePoint.x + dx * 0.5;
                bendpoints.push(new Point(midX, sourcePoint.y));
                if (maxBendpoints > 1) {
                    bendpoints.push(new Point(midX, targetPoint.y));
                }
            } else {
                // Vertical-first routing  
                const midY = sourcePoint.y + dy * 0.7;
                bendpoints.push(new Point(sourcePoint.x, midY));
                if (maxBendpoints > 1) {
                    bendpoints.push(new Point(targetPoint.x, midY));
                }
            }
        }

        return bendpoints;
    }
    
    public setBendpointConfig(config: Partial<BendpointConfig>, edges: LayoutLink []): void {
        this.config = { ...this.config, ...config };
        this.updateBendpoints(edges);
    }
}
