import React from 'react';
import {PodEventsLogTable} from "@features/project/project-pod/PodEventsLogTable";
import {Content, Divider} from "@patternfly/react-core";
import {ProjectContainerContextToolbar} from "@features/project/ProjectContainerContextToolbar";

export function PodTab() {

    return (
        <div className="project-page">
            <ProjectContainerContextToolbar/>
            <Content component='h6' style={{padding: '16px'}}>Pod Events</Content>
            <Divider/>
            <PodEventsLogTable/>
        </div>
    )
}
