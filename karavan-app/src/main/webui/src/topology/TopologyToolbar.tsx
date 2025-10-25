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
import {ReactElement, useState} from 'react';
import {Button, Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement} from '@patternfly/react-core';
import {shallow} from "zustand/shallow";
import {useAppConfigStore} from '@/api/ProjectStore';
import {useTopologyHook} from '@/topology/useTopologyHook';
import {useRouteDesignerHook} from "@/designer/route/useRouteDesignerHook";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE} from "@/api/ProjectModels";
import {ProjectTitle} from "@/project/ProjectTitle";

export function TopologyToolbar({ projectFunctions }: { projectFunctions: Function }) {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    const {createNewRestFile, createNewBean, createRouteConfiguration, createOpenApiJsonFile, isOpenApiExists, createNewKamelet} = projectFunctions();
    const {openSelector} = useRouteDesignerHook();

    const [isOpen, setIsOpen] = useState(false);

    const onToggle = () => {
        setIsOpen(!isOpen);
    };

    const onSelect = (event: React.MouseEvent<Element, MouseEvent> | undefined) => {
        event?.stopPropagation();
        setIsOpen(!isOpen);
    };

    const {selectFile} = useTopologyHook();

    function getInfraButton(): ReactElement {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const fileName = isKubernetes ? 'deployment.jkube.yaml' : DOCKER_COMPOSE;

        return (
            <Button variant={"secondary"}
                    className='bean-button'
                // icon={icon}
                    onClick={() => {
                        selectFile(fileName)
                    }}
            >
                Configuration
            </Button>
        )
    }

    return (
        <div className='topology-toolbar'>
            <div className="group-switch">
                <ProjectTitle/>
            </div>
            <div>
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={"primary"}
                        onClick={(ev) => openSelector(undefined, undefined)}
                >
                    Create Route
                </Button>
            </div>
            <div>
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={"secondary"}
                        onClick={(ev) => createOpenApiJsonFile()}
                >
                    {isOpenApiExists ? 'Open OpenAPI' : 'Create OpenAPI'}
                </Button>
            </div>
            <div>
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={"secondary"}
                        onClick={e => createNewBean()}
                >
                    Create Bean
                </Button>
            </div>
            <div>
                <Button variant={"secondary"}
                        className='bean-button'
                    // icon={<CogIcon/>}
                        onClick={() => {
                            selectFile(APPLICATION_PROPERTIES)
                        }}
                >
                    Properties
                </Button>
            </div>
            <div>
                {getInfraButton()}
            </div>
            <Dropdown
                className="dev-action-button"
                onSelect={onSelect}
                popperProps={{ position: 'right' }}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                        ref={toggleRef}
                        onClick={onToggle}
                        variant="plain"
                        isExpanded={isOpen}
                        aria-label="Action list single group kebab"
                        icon={<EllipsisVIcon/>}
                    />
                )}
                isOpen={isOpen}
                onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
            >
                <DropdownList>
                    <DropdownItem value={0} key="config" onClick={(ev) => createRouteConfiguration()}>
                        Create Route Configuration
                    </DropdownItem>
                    <DropdownItem value={1} key="template" onClick={(ev) => openSelector(undefined, undefined, true, undefined, true)}>
                        Create Route Template
                    </DropdownItem>
                    <DropdownItem value={2} key="kamelet" onClick={(ev) => createNewKamelet()}>
                        Create Kamelet
                    </DropdownItem>
                    <DropdownItem value={0} key="rest" onClick={(ev) => createNewRestFile()}>
                        Create Rest DSL
                    </DropdownItem>
                </DropdownList>
            </Dropdown>
        </div>
    )
}