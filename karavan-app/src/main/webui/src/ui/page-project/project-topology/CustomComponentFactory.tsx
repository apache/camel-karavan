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
    DragObjectWithType,
    Edge,
    GraphComponent,
    GraphElement,
    Model,
    ModelKind,
    Node,
    withContextMenu,
    withPanZoom,
    withSelection,
    withTargetDrag,
} from '@patternfly/react-topology';
import CustomGroup from "../project-topology/CustomGroup";
import {getCustomMenu} from "../project-topology/GetCustomMenu";
import CustomNode from "../project-topology/CustomNode";
import CustomEdge from "../project-topology/CustomEdge";

const CONNECTOR_TARGET_DROP = 'connector-target-drop';

export function getCustomComponentFactory(model: Model) {
    const groupNames: string[] = model.nodes
        ?.filter(n => n.type === 'group').map(n => n.id)?.filter(g => !g.startsWith("karavan-"))
        ?? [];
    return function (kind: ModelKind, type: string) {
        switch (type) {
            case 'group':
                return (withSelection()(CustomGroup));
            default:
                switch (kind) {
                    case ModelKind.graph:
                        return withSelection()(withPanZoom()(GraphComponent));
                    case ModelKind.node:
                        return withContextMenu(element => getCustomMenu(element, groupNames))(withSelection()(CustomNode));
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
                        })(withSelection()(CustomEdge));
                    default:
                        return undefined;
                }
        }
    };
}