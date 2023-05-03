import React from 'react';
import {
    Card,
    CardBody, Flex, FlexItem, Divider
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project} from "./ProjectModels";
import {ProjectRunnerToolbar} from "./ProjectRunnerToolbar";
import {ProjectRunner} from "./ProjectRunner";


interface Props {
    project: Project,
    config: any,
}

export const ProjectDevelopment = (props: Props) => {

    const {project, config} = props;
    return (
            <Card className="project-development">
                <CardBody>
                    <Flex direction={{default: "row"}}
                          justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem flex={{default: "flex_4"}}>
                            <ProjectRunner project={project} config={config} />
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_4"}}>
                            <ProjectRunner project={project} config={config} />
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem>
                            <ProjectRunnerToolbar project={project} config={config} />
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        )
}
