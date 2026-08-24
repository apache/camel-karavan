import {
    DefaultGroup,
    DragObjectWithType,
    Edge,
    GraphComponent,
    graphDropTargetSpec,
    GraphElement,
    ModelKind,
    Node,
    withContextMenu,
    withDndDrop,
    withPanZoom,
    withSelection,
    withTargetDrag,
} from '@patternfly/react-topology';
import {ArchitectureMenus} from "./ArchitectureMenu";
import {ArchitectureNode} from "./ArchitectureNode";
import ArchitectureEdge from "../architecture/ArchitectureEdge";

const CONNECTOR_TARGET_DROP = 'connector-target-drop';

export function getArchitectureComponentFactory() {
    return function (kind: ModelKind, type: string) {
        switch (type) {
            case 'group':
                return (withContextMenu(element => ArchitectureMenus(element))(withSelection()(DefaultGroup)));
            default:
                switch (kind) {
                    case ModelKind.graph:
                        return withDndDrop(graphDropTargetSpec())(withPanZoom()(GraphComponent));
                    case ModelKind.node:
                        return withContextMenu(element => ArchitectureMenus(element))(withSelection()(ArchitectureNode));
                    case ModelKind.edge:
                        return withTargetDrag<DragObjectWithType, Node, { dragging?: boolean }, { element: GraphElement; }>({
                            item: {type: CONNECTOR_TARGET_DROP},
                            begin: (monitor, props) => {
                                props.element.raise();
                                return props.element;
                            },
                            drag: (event, monitor, props) => {
                                (props.element as Edge).setEndPoint(event.x, event.y);
                            },
                            end: (dropResult: Node | undefined, monitor, props) => {
                                if (monitor.didDrop() && dropResult !== undefined && props) {
                                    (props.element as Edge).setTarget(dropResult);
                                }
                                (props.element as Edge).setEndPoint();
                            },
                            collect: (monitor) => ({
                                dragging: monitor.isDragging()
                            })
                        })(withSelection()(ArchitectureEdge));
                    default:
                        return undefined;
                }
        }
    };
}

export default getArchitectureComponentFactory