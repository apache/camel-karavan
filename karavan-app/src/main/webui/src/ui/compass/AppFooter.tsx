import React from 'react';
import {Badge, CompassMainFooter, Divider, Panel, PanelMain, PanelMainBody} from '@patternfly/react-core';
import {useProjectStore} from "@stores/ProjectStore";
import "./AppFooter.css"
import {PlatformVersions} from "@shared/ui/PlatformLogos";
import {BUILD_IN_PROJECTS} from "@models/ProjectModels";
import {ProjectStatusLabel} from "@page-projects/table/ProjectStatusLabel";
import {useAppConfig} from "@compass/useConfig";

export const AppFooter: React.FunctionComponent = () => {

    const {environment, infrastructure} = useAppConfig()
    const project = useProjectStore((s) => s.project)
    const isBuildIn = BUILD_IN_PROJECTS.includes(project?.projectId);
    const {isDev} = useAppConfig();
    const envClassName = isDev ? "" : "prod-environment"

    const environmentUI =
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: 6, alignItems:'center'}}>
            <Badge isRead className={envClassName}>{environment}</Badge>
            <Badge isRead className={envClassName}>{infrastructure}</Badge>
        </div>

    return (
        <CompassMainFooter className={"app-footer"}>
            <Panel isGlass style={{width: '100%', padding: 8}}>
                <PanelMain>
                    <PanelMainBody>
                        <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            {/*{PlatformName(12, 175)}*/}
                            <PlatformVersions/>
                            <Divider orientation={{default: 'vertical'}}/>
                            {environmentUI}
                            <Divider orientation={{default: 'vertical'}}/>
                            {!isBuildIn && <ProjectStatusLabel projectId={project?.projectId}/>}
                            <div style={{flex: 1}}/>
                        </div>
                    </PanelMainBody>
                </PanelMain>
            </Panel>
        </CompassMainFooter>
    );
};