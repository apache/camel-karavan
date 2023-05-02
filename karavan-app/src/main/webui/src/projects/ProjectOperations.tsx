import React from 'react';
import '../designer/karavan.css';
import {Project} from "./ProjectModels";
import {ProjectStatus} from "./ProjectStatus";


interface Props {
    project: Project,
    config: any,
    needCommit: boolean,
}

interface State {
    environment: string,
}

export class ProjectOperations extends React.Component<Props, State> {

    public state: State = {
        environment: this.props.config.environment
    };

    render() {
        const {project, config,} = this.props;
        return (
            <div className="project-operations">
                {["dev", "test", "prod"].map(env =>
                    <ProjectStatus key={env} project={project} config={config} env={env}/>
                )}
            </div>
        )
    }
}
