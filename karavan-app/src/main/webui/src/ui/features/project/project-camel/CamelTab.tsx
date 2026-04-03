import React, {ReactElement} from 'react';
import {Content, Divider} from "@patternfly/react-core";
import {ProjectContainerContextToolbar} from "@features/project/ProjectContainerContextToolbar";
import {InfoPanel} from "./InfoPanel";
import {RoutesTable} from "@features/project/project-camel/RoutesTable";

export function CamelTab(): ReactElement {

    return (
        <div className="project-page">
            <ProjectContainerContextToolbar/>
            <InfoPanel/>
            <Divider/>
            <Content component='h6' style={{padding: '16px'}}>Routes</Content>
            <Divider/>
            <RoutesTable/>
        </div>
    )
}
