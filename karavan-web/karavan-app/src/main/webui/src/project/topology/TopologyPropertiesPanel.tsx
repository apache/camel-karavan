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
import React from 'react';
import '../../designer/karavan.css';
import {shallow} from "zustand/shallow";
import {TopologySideBar} from "@patternfly/react-topology";
import {useTopologyStore} from "./TopologyStore";
import {DslProperties} from "../../designer/route/DslProperties";
import {Button, Flex, FlexItem, Text, Tooltip, TooltipPosition} from "@patternfly/react-core";
import CloseIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {useFilesStore, useFileStore} from "../../api/ProjectStore";

export function TopologyPropertiesPanel () {

    const [setFile] = useFileStore((s) => [s.setFile], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [selectedIds, setSelectedIds, fileName] = useTopologyStore((s) =>
        [s.selectedIds, s.setSelectedIds, s.fileName], shallow);


    function getHeader() {
        return (
            <Flex className="properties-header" direction={{default: "row"}} justifyContent={{default: "justifyContentFlexStart"}}>
                <FlexItem spacer={{ default: 'spacerNone' }}>
                    <Text>Filename:</Text>
                </FlexItem>
                <FlexItem>
                    <Button variant="link" onClick={event => {
                        if (fileName) {
                            const file = files.filter(f => f.name === fileName)?.at(0);
                            if (file) {
                                setFile('select', file);
                            }
                        }
                    }}
                    >{fileName}
                    </Button>
                </FlexItem>
                <FlexItem align={{ default: 'alignRight' }}>
                    <Tooltip content={"Close"} position={TooltipPosition.top}>
                        <Button variant="link" icon={<CloseIcon/>} onClick={event => setSelectedIds([])}/>
                    </Tooltip>
                </FlexItem>
            </Flex>
        )
    }

    return (
        <TopologySideBar
        className="topology-sidebar"
        show={selectedIds.length > 0}
        header={getHeader()}
    >
        <DslProperties isRouteDesigner={false}/>
    </TopologySideBar>
    )
}
