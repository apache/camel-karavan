import React, {ReactElement} from 'react';
import {Content, Divider} from "@patternfly/react-core";
import {useAppConfigStore} from "@stores/ProjectStore";
import {PodEventsLogTable} from "@features/integration/integration-containers/PodEventsLogTable";
import {shallow} from "zustand/shallow";
import {ProjectContainerContextToolbar} from "@features/integration/ProjectContainerContextToolbar";
import {ContainersTable} from "@features/integration/integration-containers/ContainersTable";
import {ContainersToolbar} from "@features/integration/integration-containers/ContainersToolbar";
import {ImagesPanel} from "@features/integration/integration-containers/ImagesPanel";

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
            {isKubernetes &&
                <>
                    <Content component='h6' style={{padding: '16px'}}>Pod Events</Content>
                    <Divider/>
                    <PodEventsLogTable/>
                </>
            }

        </div>
    )
}
