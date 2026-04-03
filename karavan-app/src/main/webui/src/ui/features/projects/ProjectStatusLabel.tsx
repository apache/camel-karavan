/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http:www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {ReactElement} from 'react';
import {ContainerType} from '@models/ProjectModels';
import {BuildIcon, CogIcon, CubesIcon, DevIcon, InProgressIcon, LockIcon, PackageIcon} from '@patternfly/react-icons';
import {Label} from "@patternfly/react-core";
import {useStatusesStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";

interface Props {
    projectId: string
}

export function ProjectStatusLabel(props: Props) {

    const {projectId} = props;
    const [deployments] = useStatusesStore((state) => [state.deployments], shallow)
    const {containers} = useContainerStatusesStore();
    const camelContainer = containers.filter(c => c.projectId === projectId && ['devmode', 'packaged'].includes(c.type)).at(0);
    const isCamelRunning = camelContainer && camelContainer?.state === 'running';

    const buildContainer = containers.filter(c => c.projectId === projectId && ['build'].includes(c.type)).at(0);
    const isBuildRunning = buildContainer && buildContainer?.state === 'running';
    const hasContainers = containers.filter(c => c.projectId === projectId).length > 0;
    const isRunning = containers.filter(c => c.projectId === projectId && c.state === 'running').length > 0;

    const colorRunBack = 'var(--pf-t--color--green--30)';
    const colorRun = 'var(--pf-t--global--color--status--success--200)';
    const colorControl = 'var(--pf-v6-c-button--m-control--Color)';
    const colorBack = isRunning ? colorRunBack : colorControl;
    const variant = hasContainers ? 'filled' : 'outline';
    const firstIcon = (isRunning || isBuildRunning)
        ? <CogIcon color={colorRun} className={'rotated-run-forward'}/>
        : <InProgressIcon/>;

    const typeIconColor = isRunning ? colorRun : colorControl;
    const iconMap: Record<ContainerType, ReactElement | undefined> = {
        devmode: <DevIcon color={typeIconColor}/>,
        packaged: <PackageIcon color={typeIconColor}/>,
        internal: <LockIcon color={typeIconColor}/>,
        build: <BuildIcon color={typeIconColor}/>,
        unknown: undefined,
    };

    const type: ContainerType = camelContainer?.type || buildContainer?.type || 'unknown';
    const typeIcon = iconMap[type];

    if (hasContainers) {
        return (
            <Label color={isRunning ? 'green' : 'grey'} variant={variant} style={{padding: '8px'}} >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', width: '100%'}}>
                    {firstIcon}
                    {typeIcon ? typeIcon : <CubesIcon color={typeIconColor}/>}
                </div>
            </Label>
        )
    } else {
        return (
            <div style={{display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '0.2rem', padding: '8px'}}>
                {/*<InProgressIcon/>*/}
            </div>
        )
    }
}
