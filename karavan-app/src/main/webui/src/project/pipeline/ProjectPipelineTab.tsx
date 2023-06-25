import React from 'react';
import '../../designer/karavan.css';
import {ProjectStatus} from "../ProjectStatus";
import {PageSection} from "@patternfly/react-core";
import {Project} from "../../api/ProjectModels";


interface Props {
    project: Project,
    config: any,
    needCommit: boolean,
}

interface State {
    environment: string,
}

export class ProjectPipelineTab extends React.Component<Props, State> {

    public state: State = {
        environment: this.props.config.environment
    };

    render() {
        const {project, config,} = this.props;
        return (
            <PageSection className="project-bottom" padding={{default: "padding"}}>
                <div className="project-operations">
                    {/*{["dev", "test", "prod"].map(env =>*/}
                    {["dev"].map(env =>
                        <ProjectStatus key={env} project={project} config={config} env={env}/>
                    )}
                </div>
            </PageSection>
        )
    }
}
