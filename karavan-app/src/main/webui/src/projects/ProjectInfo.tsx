import React from 'react';
import {
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription, Tooltip, Flex, FlexItem, Label
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project } from "./ProjectModels";


interface Props {
    project: Project,
    config: any,
    needCommit: boolean,
}

interface State {
    environment: string,
}

export class ProjectInfo extends React.Component<Props, State> {

    public state: State = {
        environment: this.props.config.environment
    };

    getDate(lastUpdate: number):string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toDateString() + ' ' + date.toLocaleTimeString();
        } else {
            return "N/A"
        }
    }

    getLastUpdatePanel(){
        const {project, needCommit} = this.props;
        const color = needCommit ? "grey" : "green";
        return (
            <Flex direction={{default:"row"}} justifyContent={{default: "justifyContentFlexStart"}}>
                {project?.lastCommitTimestamp && project?.lastCommitTimestamp > 0 &&
                    <FlexItem>
                        <Label color={color}>{this.getDate(project?.lastCommitTimestamp)}</Label>
                    </FlexItem>
                }
                <FlexItem>
                    <Tooltip content={project?.lastCommit} position={"right"}>
                        <Label color={color}>{project?.lastCommit ? project?.lastCommit?.substr(0, 7) : "-"}</Label>
                    </Tooltip>
                </FlexItem>
            </Flex>)
    }

    render() {
        const {project} = this.props;
        return (<DescriptionList isHorizontal>
            <DescriptionListGroup>
                <DescriptionListTerm>Project ID</DescriptionListTerm>
                <DescriptionListDescription>{project?.projectId}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Name</DescriptionListTerm>
                <DescriptionListDescription>{project?.name}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>{project?.description}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
                <DescriptionListTerm>Updated</DescriptionListTerm>
                <DescriptionListDescription>
                    {this.getLastUpdatePanel()}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>);
    }
}
