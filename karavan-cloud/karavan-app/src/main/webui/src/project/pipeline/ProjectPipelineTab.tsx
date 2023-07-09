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
                {["dev"].map(env =>
                    <ProjectStatus key={env} project={project} config={config} env={env}/>
                )}
            </div>
        </PageSection>
    )
}
