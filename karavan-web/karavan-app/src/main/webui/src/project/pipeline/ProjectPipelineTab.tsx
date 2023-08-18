import React from 'react';
import '../../designer/karavan.css';
import {ProjectStatus} from "./ProjectStatus";
import {PageSection} from "@patternfly/react-core";
import {useAppConfigStore, useProjectStore} from "../../api/ProjectStore";


export const ProjectPipelineTab = () => {

    const {config} = useAppConfigStore();
    const {project} = useProjectStore();

    return (
        <PageSection className="project-tab-panel" padding={{default: "padding"}}>
            <div className="project-operations">
                {/*{["dev", "test", "prod"].map(env =>*/}
                {config.environments.map(env =>
                    <ProjectStatus env={env}/>
                )}
            </div>
        </PageSection>
    )
}
