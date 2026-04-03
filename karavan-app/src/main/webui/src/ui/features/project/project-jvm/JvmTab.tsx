import React, {ReactElement} from 'react';
import {InfoPanel} from "@features/project/project-jvm/InfoPanel";
import {Content, Divider} from "@patternfly/react-core";
import {ThreadsTable} from "@features/project/project-jvm/ThreadsTable";
import {ProjectContainerContextToolbar} from "@features/project/ProjectContainerContextToolbar";

export function JvmTab(): ReactElement {

    return (
        <div className="project-page">
            <ProjectContainerContextToolbar/>
            <InfoPanel/>
            <Divider/>
            <Content component='h6' style={{padding: '16px'}}>Threads</Content>
            <Divider/>
            <ThreadsTable/>
        </div>
    )
}
