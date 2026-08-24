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

import * as React from 'react';

import './topology.css';
import {DefaultEdge, EdgeTerminalType, NodeStatus, observer} from '@patternfly/react-topology';
import {useArchitectureStore} from "@stores/ArchitectureStore";

const CustomEdge: React.FC<any> = observer(({ element, selected, ...rest }) => {

    const selectedNodes = useArchitectureStore((s) => s.selectedNodes);
    const selectedVariable = useArchitectureStore((s) => s.selectedVariable)
    const data = element.getData();
    const type = data?.type;
    const endTerminalType = type === 'bean' ? EdgeTerminalType.none : EdgeTerminalType.directional;

    const sourceId = element.getSource()?.getId();
    const targetId = element.getTarget()?.getId();
    const isConnectedNodeSelected = selectedNodes.includes(sourceId) || (selectedNodes.includes(targetId));

    let className = data?.state ? `edge-state-${data?.state?.toLowerCase()}` : "";
    if (selectedVariable !== null) {
        className += ` not-used-edge`;
    }

    return (
        <DefaultEdge
            element={element}
            startTerminalType={EdgeTerminalType.none}
            endTerminalType={endTerminalType}
            endTerminalSize={10}
            endTerminalStatus={data?.endTerminalStatus || NodeStatus.default}
            tagStatus={data?.endTerminalStatus || NodeStatus.default}
            tag={data?.label}
            className={className}
            selected={isConnectedNodeSelected}
            {...rest}
        />
    )
})
export default CustomEdge;