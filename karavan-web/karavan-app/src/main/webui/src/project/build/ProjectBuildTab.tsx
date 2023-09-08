import React from 'react';
import '../../designer/karavan.css';
import {BuildPanel} from "./BuildPanel";
import {PageSection} from "@patternfly/react-core";
import {useAppConfigStore, useProjectStore} from "../../api/ProjectStore";

export function ProjectBuildTab () {

    const {config} = useAppConfigStore();
    const {project} = useProjectStore();

    return (
        <PageSection className="project-tab-panel project-build-panel" padding={{default: "padding"}}>
            <div>
                {/*{["dev", "test", "prod"].map(env =>*/}
                {config.environments.map(env =>
                    <BuildPanel env={env}/>
                )}
            </div>
        </PageSection>
    )
}
