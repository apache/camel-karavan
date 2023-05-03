import React from 'react';
import {
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
    Tooltip,
    Flex,
    FlexItem,
    Label,
    Button,
    Modal,
    ModalVariant,
    Form,
    FormGroup,
    TextInput,
    FormHelperText
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {Project} from "./ProjectModels";
import {KaravanApi} from "../api/KaravanApi";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";


interface Props {
    project: Project,
    config: any,
}

interface State {
    environment: string,
    isPushing: boolean,
    commitMessageIsOpen: boolean,
    commitMessage: string
}

export class ProjectRunner extends React.Component<Props, State> {

    public state: State = {
        environment: this.props.config.environment,
        isPushing: false,
        commitMessageIsOpen: false,
        commitMessage: ''
    };

    push = (after?: () => void) => {
        this.setState({isPushing: true, commitMessageIsOpen: false});
        const params = {
            "projectId": this.props.project.projectId,
            "message": this.state.commitMessage
        };
        KaravanApi.push(params, res => {
            if (res.status === 200 || res.status === 201) {
                this.setState({isPushing: false});
                after?.call(this);
                // this.props.onRefresh.call(this);
            } else {
                // Todo notification
            }
        });
    }

    getDate(lastUpdate: number): string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toISOString().slice(0, 19).replace('T',' ');
        } else {
            return "N/A"
        }
    }

    getLastUpdatePanel() {
        const {project} = this.props;
        const color = true ? "grey" : "green";
        return (
            <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexStart"}}>
                {project?.lastCommitTimestamp && project?.lastCommitTimestamp > 0 &&
                    <FlexItem>
                        <Label color={color}>{this.getDate(project?.lastCommitTimestamp)}</Label>
                    </FlexItem>
                }
            </Flex>
        )
    }

    getCommitPanel() {
        const {isPushing, commitMessage} = this.state;
        const {project} = this.props;
        const color = true ? "grey" : "green";
        return (
            <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}}>
                <FlexItem>
                    <Tooltip content={project?.lastCommit} position={"right"}>
                        <Label
                            color={color}>{project?.lastCommit ? project?.lastCommit?.substr(0, 18) : "-"}</Label>
                    </Tooltip>
                </FlexItem>
                <FlexItem>

                </FlexItem>
            </Flex>
        )
    }

    getCommitModal() {
        let {commitMessage, commitMessageIsOpen} = this.state;
        return (
            <Modal
                title="Commit"
                variant={ModalVariant.small}
                isOpen={commitMessageIsOpen}
                onClose={() => this.setState({commitMessageIsOpen: false})}
                actions={[
                    <Button key="confirm" variant="primary" onClick={() => this.push()}>Save</Button>,
                    <Button key="cancel" variant="secondary"
                            onClick={() => this.setState({commitMessageIsOpen: false})}>Cancel</Button>
                ]}
            >
                <Form autoComplete="off" isHorizontal className="create-file-form">
                    <FormGroup label="Message" fieldId="name" isRequired>
                        <TextInput value={commitMessage} onChange={value => this.setState({commitMessage: value})}/>
                        <FormHelperText isHidden={false} component="div"/>
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    render() {
        const {project} = this.props;
        return (
            <React.Fragment>
                <DescriptionList isHorizontal>
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
                    <DescriptionListGroup>
                        <DescriptionListTerm>Commit</DescriptionListTerm>
                        <DescriptionListDescription>
                            {this.getCommitPanel()}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
                {this.getCommitModal()}
            </React.Fragment>
        );
    }
}
