import React from 'react';
import {
    Card,
    CardBody, Flex, FlexItem, Divider
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project} from "./ProjectModels";
import {ProjectInfo} from "./ProjectInfo";
import {ProjectRunner} from "./ProjectRunner";


interface Props {
    project: Project,
    config: any,
    needCommit: boolean,
}

interface State {
    environment: string,
}

export class ProjectDevelopment extends React.Component<Props, State> {

    public state: State = {
        environment: this.props.config.environment
    };

    render() {
        const {project, config, needCommit} = this.props;
        return (
            <Card className="project-info">
                <CardBody>
                    <Flex direction={{default: "row"}}
                          // style={{height: "200px"}}
                          justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem flex={{default: "flex_2"}}>
                            <ProjectInfo project={project} config={config} needCommit={needCommit} />
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_3"}}>
                            <ProjectRunner project={project} config={config} needCommit={needCommit} />
                        </FlexItem>
                    </Flex>
                </CardBody>
                {/*{this.state.showDeleteConfirmation && this.getDeleteConfirmation()}*/}
            </Card>
        )
    }
}
