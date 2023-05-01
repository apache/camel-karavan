import React from 'react';
import {
    Card,
    CardBody, CardTitle, Flex, FlexItem, Label
} from '@patternfly/react-core';
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
            ["dev", "test", "prod"].map(env =>
                <Card className="project-info">
                    <CardBody>
                        <Flex direction={{default: "row"}}
                            // style={{height: "200px"}}
                              justifyContent={{default: "justifyContentSpaceBetween"}}>
                            <FlexItem flex={{default: "flex_2"}}>
                                <ProjectStatus project={project} config={config} env={env} />
                            </FlexItem>
                        </Flex>
                    </CardBody>
                </Card>
            )
        )
    }
}
