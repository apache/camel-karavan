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
    Button, Checkbox, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleAction, MenuToggleElement,
    ToolbarItem, Tooltip
} from '@patternfly/react-core';
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useTopologyStore} from "./TopologyStore";
import {shallow} from "zustand/shallow";
import CogIcon from "@patternfly/react-icons/dist/js/icons/cog-icon";
import {useTopologyHook} from "./useTopologyHook";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";
import {KubernetesIcon} from "../designer/icons/ComponentIcons";
import {useAppConfigStore} from "../api/ProjectStore";
import {useRouteDesignerHook} from "../designer/route/useRouteDesignerHook";

interface Props {
    onClickAddRouteConfiguration: () => void
    onClickAddREST: () => void
    onClickAddKamelet: () => void
    onClickAddBean: () => void
    isDev?: boolean
}

export function TopologyToolbar (props: Props) {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [showGroups, setShowGroups, showBeans, setShowBeans, showLegend, setShowLegend] = useTopologyStore((s) =>
        [s.showGroups, s.setShowGroups, s.showBeans, s.setShowBeans, s.showLegend, s.setShowLegend], shallow);

    const [isToggleOpen, setIsToggleOpen] = React.useState(false);

    const isDev = props.isDev
    const {selectFile} = useTopologyHook();
    const {openSelector} = useRouteDesignerHook();

    function getInfraButton(): React.JSX.Element {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const icon = !isKubernetes ? KubernetesIcon('button-icon-k8s') : <DockerIcon className='icon-docker'/>;
        const fileName = isKubernetes ? 'deployment.jkube.yaml' : 'docker-compose.yaml';

        return (
            <Button variant={"secondary"}
                    className='bean-button'
                    onClick={() => {selectFile(fileName)}}
            >
                {icon}
            </Button>
        )
    }

    const onToggleClick = () => {
        setIsToggleOpen(!isToggleOpen);
    };

    const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
        // eslint-disable-next-line no-console
        setIsToggleOpen(false);
    };

    function getRouteButton() {
        return (
            <Dropdown
                isOpen={isToggleOpen}
                onSelect={onSelect}
                onOpenChange={(isOpen: boolean) => setIsToggleOpen(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                        ref={toggleRef}
                        aria-label="dropdown toggle"
                        className="create-route-dropdown-toggle"
                        variant="primary"
                        onClick={onToggleClick}
                        isExpanded={isToggleOpen}
                        splitButtonOptions={{
                            variant: 'action',
                            items: [
                                <MenuToggleAction id="route-button" key="split-action" aria-label="Route"
                                                  className="dev-action-button create-route-button"
                                                  onClick={(ev) => openSelector(undefined, undefined)}
                                >
                                    <PlusIcon/>
                                    Route
                                </MenuToggleAction>
                            ]
                        }}
                    >
                    </MenuToggle>
                )}
            >
                <DropdownList>
                    <DropdownItem value={0} key="config" icon={<PlusIcon/>} onClick={(ev) => props.onClickAddRouteConfiguration()}>
                        Route Configuration
                    </DropdownItem>
                    <DropdownItem value={1} key="template" icon={<PlusIcon/>} onClick={(ev) => openSelector(undefined, undefined, true, undefined, true)}>
                        Route Template
                    </DropdownItem>
                </DropdownList>
            </Dropdown>
        )
    }

    return (
        <div className='topology-toolbar'>
            <ToolbarItem className="group-switch">
                <Tooltip content={"Show Consumer and Producer Groups"} position={"bottom-start"}>
                    <Checkbox
                        id="reversed-groups-switch"
                        label="Groups:"
                        isChecked={showGroups}
                        onChange={(_, checked) => setShowGroups(checked)}
                        isLabelBeforeButton
                    />
                </Tooltip>
                <Tooltip content={"Show Beans"} position={"bottom-start"}>
                    <Checkbox
                        id="reversed-beans-switch"
                        label="Beans:"
                        isChecked={showBeans}
                        onChange={(_, checked) => setShowBeans(checked)}
                        isLabelBeforeButton
                    />
                </Tooltip>
                <Tooltip content={"Show Legend"} position={"bottom-start"}>
                    <Checkbox
                        id="reversed-legend-switch"
                        label="Legend:"
                        isChecked={showLegend}
                        onChange={(_, checked) => setShowLegend(checked)}
                        isLabelBeforeButton
                    />
                </Tooltip>
            </ToolbarItem>
            <ToolbarItem align={{default:"alignRight"}}>
                {getRouteButton()}
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
            <ToolbarItem align={{default:"alignRight"}}>
                <Button variant={"secondary"}
                        className='bean-button'
                        icon={<CogIcon/>}
                        onClick={() => {selectFile('application.properties')}}
                >
                    Properties
                </Button>
            </ToolbarItem>
            <ToolbarItem align={{default:"alignRight"}}>
                {getInfraButton()}
            </ToolbarItem>
        </div>
    )
}