import React, {ReactElement} from 'react';
import {Button,} from '@patternfly/react-core';
import {ContainerStatus, ContainerType} from "@models/ProjectModels";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {useHealthStore} from "@stores/DashboardStore";
import {Health} from "@models/DashboardModels";
import './KaravanContainerButton.css'
import DevIcon from "@patternfly/react-icons/dist/esm/icons/dev-icon";
import {BuildIcon, LockIcon, PackageIcon, UnknownIcon} from "@patternfly/react-icons";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@app/navigation/Routes";

export interface Props {
    container: ContainerStatus
}

export function KaravanContainerButton(props: Props) {

    const healths = useHealthStore((s) => s.healths)
    const navigate = useNavigate();

    const container = props.container;
    const health = healths.filter(c => c.projectId === container.projectId).at(0) || new Health();
    const isRunning = container && container.state === 'running';
    const isUp = health.status === 'UP';

    const buttonClassName = isRunning ? "karavan-container-button-up" : "karavan-container-button-down";
    const iconClassName = isRunning ? "karavan-container-button-icon-up" : "karavan-container-button-icon-down";
    const buttonVariant = isUp ? "secondary" : "tertiary";
    const icon = isRunning ? <UpIcon className={iconClassName}/> : <DownIcon color={'var(--pf-v6-c-button--m-control--Color)'}/>;
    const typeIconColor = isRunning ? 'var(--pf-t--global--color--status--success--100)' : 'var(--pf-v6-c-button--m-control--Color)';
    const iconMap: Record<ContainerType, ReactElement> = {
        devmode: <DevIcon color={typeIconColor}/>,
        packaged: <PackageIcon color={typeIconColor}/>,
        internal: <LockIcon color={typeIconColor}/>,
        build: <BuildIcon color={typeIconColor}/>,
        unknown: <UnknownIcon color={typeIconColor}/>,
    };
    const type: ContainerType = container?.type || 'unknown';
    const typeIcon = iconMap[type];

    return (
        <Button variant={buttonVariant} icon={icon}
                className={buttonClassName}
                onClick={e => {
                    navigate(`${ROUTES.PROJECTS}/${container.projectId}`);
                }}
        >
            <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                {container?.containerName}
                {typeIcon}
            </div>
        </Button>
    )
}