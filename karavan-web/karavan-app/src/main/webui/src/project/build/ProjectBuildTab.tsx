import React from 'react';
import '../../designer/karavan.css';
import {BuildPanel} from "./BuildPanel";
import {PageSection} from "@patternfly/react-core";

export function ProjectBuildTab () {

    return (
        <PageSection className="project-tab-panel project-build-panel" padding={{default: "padding"}}>
            <div>
                <BuildPanel/>
            </div>
        </PageSection>
    )
}
