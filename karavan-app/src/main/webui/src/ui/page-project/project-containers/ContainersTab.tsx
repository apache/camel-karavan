import React, {ReactElement} from 'react';
import {Content, Divider} from "@patternfly/react-core";
import {useAppConfigStore} from "@stores/ProjectStore";
import ContainersTable from "../project-containers/ContainersTable";
import {ImagesPanel} from "../project-containers/ImagesPanel";
import {DeploymentPanel} from "../project-containers/DeploymentPanel";
import {PodEventsLogTable} from "@page-project/project-containers/PodEventsLogTable";
import {ProjectContainerContextToolbar} from "@page-project/ProjectContainerContextToolbar";
import {ContainersToolbar} from "@page-project/project-containers/ContainersToolbar";
import "./ContainersTab.css"

export function ContainersTab(): ReactElement {

    const config = useAppConfigStore((s) => s.config)
    const isKubernetes = (config.infrastructure === 'kubernetes')

    const kubernetesPanel = (
        <div className={"panel"}>
            <Content component='h6' style={{padding: '16px'}}>Deployments</Content>
            <Divider/>
            <DeploymentPanel/>
            <Divider/>
            <Content component='h6' style={{padding: '16px'}}>Pods</Content>
            <Divider/>
            <ContainersTable/>
            <Divider/>
            <PodEventsLogTable/>
        </div>
    )

    const dockerPanel = (
        <div className={"panel"}>
            <Content component='h6' style={{padding: '16px'}}>Containers</Content>
            <Divider/>
            <ContainersTable/>
            <Divider/>
            <ImagesPanel/>
        </div>
    )

    return (
        <div className={"containers-tab"}>
            <ProjectContainerContextToolbar additionalTools={<ContainersToolbar/>} hideContainersToggle={true}/>
            {isKubernetes && kubernetesPanel}
            {!isKubernetes && dockerPanel}
        </div>
    )
}
