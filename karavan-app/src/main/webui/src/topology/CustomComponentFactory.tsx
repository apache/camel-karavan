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
    ComponentFactory, ContextMenuItem,
    GraphComponent, GraphElement,
    ModelKind,withContextMenu,
    withPanZoom,
    withSelection
} from '@patternfly/react-topology';
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";
import CustomGroup from "./CustomGroup";
import * as React from "react";
import {ReactElement} from "react";

export const CustomComponentFactory: ComponentFactory = (kind: ModelKind, type: string) => {

    function createContextMenu(element: GraphElement):ReactElement[] | Promise<ReactElement[]> {
        const result: React.ReactElement<any, string | React.JSXElementConstructor<any>>[] | Promise<React.ReactElement<any, string | React.JSXElementConstructor<any>>[]> = []
        const data = element.getData();
        result.push(
            <ContextMenuItem key={element.getId() + "-open"} onClick={() => data?.selectFile?.(data?.fileName)}>
                Open
            </ContextMenuItem>
        );
        if (data?.type === 'route') {
            result.push(
                <ContextMenuItem key={element.getId()}
                                 onClick={() => data?.setDisabled?.(data?.fileName, data?.routeId, !(data?.autoStartup))}>
                    {data?.autoStartup === false ? 'Enable' : 'Disable'}
                </ContextMenuItem>
            );
        } else if (data?.type === 'step' && data?.outgoing) {
            result.push(
                <ContextMenuItem key={element.getId()}
                                 onClick={() => data?.setDisabled?.(data?.fileName, data?.step.id, !(data?.disabled))}>
                    {data?.disabled ? 'Enable' : 'Disable'}
                </ContextMenuItem>
            );
        }
        return result;
    }

    switch (type) {
        case 'group':
            return withSelection()(CustomGroup);
        default:
            switch (kind) {
                case ModelKind.graph:
                    return withPanZoom()(GraphComponent);
                case ModelKind.node:
                    return withContextMenu(element => createContextMenu(element))(withSelection()(CustomNode));
                case ModelKind.edge:
                    return (withSelection()(CustomEdge));
                default:
                    return undefined;
            }
    }
}