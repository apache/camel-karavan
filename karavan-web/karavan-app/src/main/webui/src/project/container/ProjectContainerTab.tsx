import React from 'react';
import {
    PageSection
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useAppConfigStore} from "../../api/ProjectStore";
import {ContainerPanel} from "./ContainerPanel";

export function ProjectContainerTab() {

    const {config} = useAppConfigStore();

    return (
        <PageSection className="project-tab-panel project-build-panel" padding={{default: "padding"}}>
            <div>
                {config.environments.map(env =>
                    <ContainerPanel key={env} env={env}/>
                )}
            </div>
        </PageSection>
    )
}
