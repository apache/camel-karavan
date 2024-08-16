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
import {
    Button, Switch,
    ToolbarItem, Tooltip
} from '@patternfly/react-core';
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useTopologyStore} from "./TopologyStore";
import {shallow} from "zustand/shallow";


interface Props {
    onClickAddRoute: () => void
    onClickAddREST: () => void
    onClickAddKamelet: () => void
    onClickAddBean: () => void
    isDev?: boolean
}

export function TopologyToolbar (props: Props) {

    const [showGroups, setShowGroups] = useTopologyStore((s) =>
        [s.showGroups, s.setShowGroups], shallow);
    const isDev = props.isDev

    return (
        <div className='topology-toolbar'>
            <ToolbarItem className="group-switch">
                <Tooltip content={"Show Consumer and Producer Groups"} position={"bottom-start"}>
                    <Switch
                        id="reversed-switch"
                        label="Groups"
                        isChecked={showGroups}
                        onChange={(_, checked) => setShowGroups(checked)}
                        isReversed
                    />
                </Tooltip>
            </ToolbarItem>
            <ToolbarItem align={{default:"alignRight"}}>
                <Tooltip content={"Add Integration Route"} position={"bottom"}>
                    <Button className="dev-action-button" size="sm"
                            isDisabled={!isDev}
                            variant={"primary"}
                            icon={<PlusIcon/>}
                            onClick={e => props.onClickAddRoute()}
                    >
                        Route
                    </Button>
                </Tooltip>
            </ToolbarItem>
            <ToolbarItem align={{default:"alignRight"}}>
                <Tooltip content={"Add REST API"} position={"bottom"}>
                    <Button className="dev-action-button" size="sm"
                            isDisabled={!isDev}
                            variant={"secondary"}
                            icon={<PlusIcon/>}
                            onClick={e => props.onClickAddREST()}
                    >
                        REST
                    </Button>
                </Tooltip>
            </ToolbarItem>
            <ToolbarItem align={{default:"alignRight"}}>
                <Tooltip content={"Add Kamelet"} position={"bottom"}>
                    <Button className="dev-action-button" size="sm"
                            isDisabled={!isDev}
                            variant={"secondary"}
                            icon={<PlusIcon/>}
                            onClick={e => props.onClickAddKamelet()}
                    >
                        Kamelet
                    </Button>
                </Tooltip>
            </ToolbarItem>
            <ToolbarItem align={{default:"alignRight"}}>
                <Tooltip content={"Add Bean"} position={"bottom"}>
                    <Button className="dev-action-button" size="sm"
                            isDisabled={!isDev}
                            variant={"secondary"}
                            icon={<PlusIcon/>}
                            onClick={e => props.onClickAddBean()}
                    >
                        Bean
                    </Button>
                </Tooltip>
            </ToolbarItem>
        </div>
    )
}