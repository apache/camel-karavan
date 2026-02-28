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
import {MouseEventHandler, ReactElement} from 'react';
import {Button} from '@patternfly/react-core';
import {shallow} from "zustand/shallow";
import {useAppConfigStore} from '@stores/ProjectStore';
import {useTopologyHook} from '@features/project/project-topology/useTopologyHook';
import {useRouteDesignerHook} from "@features/project/designer/route/useRouteDesignerHook";
import {APPLICATION_PROPERTIES, DOCKER_COMPOSE, DOCKER_STACK} from "@models/ProjectModels";
import {ProjectTitle} from "@features/project/ProjectTitle";
import {useProjectFunctions} from "@features/project/ProjectContext";
import {AddLarge} from "@carbon/icons-react";

export function TopologyToolbar() {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    const {
        createNewBean,
        createRouteConfiguration,
        createOpenApi,
        createNewKamelet,
        project
    } = useProjectFunctions();
    const {openSelector} = useRouteDesignerHook();

    const {selectFile} = useTopologyHook();

    function getInfraButton(): ReactElement {
        const isKubernetes = config.infrastructure === 'kubernetes';
        const swarmMode = config.swarmMode;
        const fileName = isKubernetes
            ? 'deployment.jkube.yaml'
            : (swarmMode ? DOCKER_STACK : DOCKER_COMPOSE);

        return (
            <div>
                <Button variant={"tertiary"}
                        className='bean-button'
                        // icon={<OutlinedFileAltIcon/>}
                        onClick={() => {
                            selectFile(fileName)
                        }}
                >
                    {isKubernetes ? "Deployment" : "Compose"}
                </Button>
            </div>
        )
    }

    function getButton(caption: string,
                       variant?: 'primary' | 'secondary' | 'tertiary' | 'danger' | 'warning' | 'link' | 'plain' | 'control' | 'stateful',
                       icon?: ReactElement,
                       onClick?: MouseEventHandler<any> | undefined): ReactElement {
        return (
            <div>
                <Button className="dev-action-button "
                        isDisabled={!isDev}
                        icon={icon}
                        variant={variant}
                        onClick={onClick}
                >
                    {caption}
                </Button>
            </div>
        )
    }


    return (
        <div className='topology-toolbar'>
            <div className="group-switch">
                <ProjectTitle/>
            </div>

            {getButton("Route", 'primary', <AddLarge className='carbon'/>, event => openSelector(undefined, undefined))}
            {getButton("Route Configuration", 'secondary', <AddLarge className='carbon'/>, event => createRouteConfiguration())}
            {getButton("Route Template", 'secondary', <AddLarge className='carbon'/>, event => openSelector(undefined, undefined, true, undefined, true))}
            {getButton("Kamelet", 'tertiary', <AddLarge className='carbon'/>, event => createNewKamelet())}
            {getButton("Bean", 'tertiary', <AddLarge className='carbon'/>, event => createNewBean())}
            {getButton("Properties", 'tertiary', undefined, event => selectFile(APPLICATION_PROPERTIES))}
            {getInfraButton()}
        </div>
    )
}