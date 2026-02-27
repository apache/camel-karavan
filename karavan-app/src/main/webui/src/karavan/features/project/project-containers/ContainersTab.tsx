import React, {ReactElement} from 'react';
import {Content, Divider} from "@patternfly/react-core";
import {useAppConfigStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectContainerContextToolbar} from "@features/project/ProjectContainerContextToolbar";
import {ContainersTable} from "@features/project/project-containers/ContainersTable";
import {ContainersToolbar} from "@features/project/project-containers/ContainersToolbar";
import {ImagesPanel} from "@features/project/project-containers/ImagesPanel";

export function ContainersTab(): ReactElement {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const isKubernetes = (config.infrastructure === 'kubernetes')

    return (
        <div className="project-page">
            <ProjectContainerContextToolbar additionalTools={<ContainersToolbar/>} hideContainersToggle={true}/>
            <Content component='h6' style={{padding: '16px'}}>Containers</Content>
            <Divider/>
            <ContainersTable/>
            <Divider/>
            {!isKubernetes && <ImagesPanel/>}
        </div>
    )
}
