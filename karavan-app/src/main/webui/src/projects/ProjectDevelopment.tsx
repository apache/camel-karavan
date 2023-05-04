import React from 'react';
import {
    Card,
    CardBody, Flex, FlexItem, Divider
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project} from "./ProjectModels";
import {RunnerToolbar} from "./RunnerToolbar";
import {RunnerInfoPod} from "./RunnerInfoPod";


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
                        <FlexItem flex={{default: "flex_1"}}>
                            <RunnerInfoPod project={project} config={config} />
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            {/*<Runner project={project} config={config} />*/}
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem>
                            <RunnerToolbar project={project} config={config} />
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        )
}
