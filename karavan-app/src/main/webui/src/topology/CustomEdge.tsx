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
import {useTopologyStore} from "./TopologyStore";
import {shallow} from "zustand/shallow";


const CustomEdge: React.FC<any> = observer(({ element, ...rest }) => {

    const [selectedIds] = useTopologyStore((s) => [s.selectedIds], shallow);

    const data = element.getData();
    const label = ((selectedIds.includes(element.getId())) && data?.label) ? data.label : '';

    return (
        <DefaultEdge
            element={element}
            startTerminalType={EdgeTerminalType.none}
            endTerminalType={EdgeTerminalType.directional}
            endTerminalSize={10}
            endTerminalStatus={data?.endTerminalStatus || NodeStatus.default}
            tagStatus={data?.endTerminalStatus || NodeStatus.default}
            tag={label}
            {...rest}
        />
    )
})
export default CustomEdge;