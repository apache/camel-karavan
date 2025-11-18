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
import {Button} from '@patternfly/react-core';
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {useLogStore} from "@/api/ProjectStore";
import {ContainerStatus, ContainerType} from '@/api/ProjectModels';
import DevIcon from "@patternfly/react-icons/dist/esm/icons/dev-icon";
import './ContainerButton.css'
import {BuildIcon, LockIcon, PackageIcon, ServiceIcon, UnknownIcon} from '@patternfly/react-icons';

interface Props {
    container: ContainerStatus,
}

export function ContainerButton(props: Props) {

    const {container} = props;
    const isRunning = container && container.state === 'running';
    const buttonClassName = isRunning ? "karavan-container-button-up" : "karavan-container-button-down";
    const iconClassName = isRunning ? "karavan-container-button-icon-up" : "karavan-container-button-icon-down";
    const buttonVariant = isRunning ? "secondary" : "tertiary";
    const icon = isRunning ? <UpIcon className={iconClassName}/> : <DownIcon color={'var(--pf-v6-c-button--m-control--Color)'}/>;
    const typeIconColor = isRunning ? 'var(--pf-t--global--color--status--success--100)' : 'var(--pf-v6-c-button--m-control--Color)';
    const iconMap: Record<ContainerType, ReactElement> = {
        devmode: <DevIcon color={typeIconColor}/>,
        devservice: <ServiceIcon color={typeIconColor}/>,
        packaged: <PackageIcon color={typeIconColor}/>,
        internal: <LockIcon color={typeIconColor}/>,
        build: <BuildIcon color={typeIconColor}/>,
        unknown: <UnknownIcon color={typeIconColor}/>,
    };
    const typeMap: Record<ContainerType, string> = {
        devmode: 'container',
        devservice: 'devservice',
        packaged: 'container',
        internal: 'internal',
        build: 'build',
        unknown: 'unknown',
    };
    const type: ContainerType = container?.type || 'unknown';
    const typeIcon = iconMap[type];

    return (
        <Button variant={buttonVariant} icon={icon}
                className={buttonClassName}
                onClick={e => {
                    useLogStore.setState({showLog: true, type: typeMap[type] as 'container' | 'build' | 'none', podName: container.containerName});
                }}
        >
            <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                {container?.containerName}
                {typeIcon}
            </div>
        </Button>
    )
}
