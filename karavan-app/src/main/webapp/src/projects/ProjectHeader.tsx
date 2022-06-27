import React from 'react';
import {
    Badge,
    Button,
    Text,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
    Card,
    CardBody, Spinner, Tooltip, Flex, FlexItem
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {Project, ProjectFileTypes, ProjectStatus} from "../models/ProjectModels";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";

interface Props {
    project: Project,
    config: any,
}

interface State {
    project?: Project,
    status?: ProjectStatus,
    isPushing: boolean,
    isBuilding: boolean,
    environments: string[],
    environment: string,
    key?: string,
}

export class ProjectHeader extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        isPushing: false,
        isBuilding: false,
        environments: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? Array.from(this.props.config.environments) : [],
        environment: this.props.config.environments && Array.isArray(this.props.config.environments)
            ? this.props.config.environments[0] : ''
    };
    interval: any;

    componentDidMount() {
        this.onRefresh();
        this.interval = setInterval(() => this.onRefreshStatus(), 3000);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    onRefresh = () => {
        if (this.props.project) {
            KaravanApi.getProject(this.props.project.projectId, (project: Project) => {
                this.setState({
                    project: project
                })
            });
        }
    }

    onRefreshStatus = () => {
        if (this.props.project) {
            KaravanApi.getProjectStatus(this.props.project.projectId, (status: ProjectStatus) => {
                this.setState({
                    key: Math.random().toString(),
                    status: status
                });
                // console.log(status);
            });
        }
    }

    push = (after?: () => void) => {
        this.setState({isPushing: true});
        KaravanApi.push(this.props.project, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isPushing: false});
                after?.call(this);
                this.onRefresh();
            } else {
                // Todo notification
            }
        });
    }

    build = () => {
        this.setState({isBuilding: true});
        KaravanApi.tekton(this.props.project, this.state.environment, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isBuilding: false});
                this.onRefresh();
            } else {
                // Todo notification
            }
        });
    }

    getType = (name: string) => {
        const extension = name.substring(name.lastIndexOf('.') + 1);
        const type = ProjectFileTypes.filter(p => p.extension === extension).map(p => p.title)[0];
        if (type) {
            return type
        } else {
            return "Unknown"
        }
    }

    pushButton = () => {
        const isPushing = this.state.isPushing;
        return (<Tooltip content="Commit and push to git" position={"left"}>
            <Button isLoading={isPushing ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isPushing ? <PushIcon/> : <div></div>}
                    onClick={e => this.push()}>
                {isPushing ? "..." : "Commit"}
            </Button>
        </Tooltip>)
    }

    buildButton = () => {
        const isDeploying = this.state.isBuilding;
        return (<Tooltip content="Commit, push, build and deploy" position={"left"}>
            <Button isLoading={isDeploying ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isDeploying ? <BuildIcon/> : <div></div>}
                    onClick={e => {
                        this.push(() => this.build());
                    }}>
                {isDeploying ? "..." : "Build"}
            </Button>
        </Tooltip>)
    }

    getCurrentStatus() {
        return (<Text>OK</Text>)
    }

    getPipelineState() {
        const {project, status} = this.state;
        const isRunning = status?.pipeline === 'Running';
        const isFailed = status?.pipeline === 'Failed';
        const isSucceeded = status?.pipeline === 'Succeeded';
        let classname = "pipeline"
        if (isRunning) classname = classname + " pipeline-running";
        if (isFailed) classname = classname + " pipeline-running";
        if (isSucceeded) classname = classname + " pipeline-succeeded";
        return (
            <Flex spaceItems={{default: 'spaceItemsNone'}} className={classname} direction={{default: "row"}}
                  alignItems={{default: "alignItemsCenter"}}>
                <FlexItem style={{height: "18px"}}>
                    {isRunning && <Spinner isSVG diameter="16px"/>}
                </FlexItem>
                <FlexItem style={{height: "18px"}}>
                    {project?.lastPipelineRun ? project?.lastPipelineRun : "-"}
                </FlexItem>
            </Flex>
        )
    }

    isUp(env: string): boolean {
        if (this.state.status) {
            return this.state.status.statuses.find(s => s.environment === env)?.status === 'UP';
        } else {
            return false;
        }
    }

    render() {
        const {project, environments, status} = this.state;
        return (
            <Card>
                <CardBody isFilled>
                    <Flex direction={{default: "row"}} alignContent={{default: "alignContentSpaceBetween"}}
                          style={{width: "100%"}}>
                        <FlexItem flex={{default: "flex_1"}}>
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
                            </DescriptionList>
                        </FlexItem>
                        <FlexItem flex={{default: "flex_1"}}>
                            <DescriptionList isHorizontal>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Commit</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Tooltip content={project?.lastCommit} position={"bottom"}>
                                            <Badge>{project?.lastCommit ? project?.lastCommit?.substr(0, 7) : "-"}</Badge>
                                        </Tooltip>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                    <DescriptionListTerm>Pipeline Run</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        {this.getPipelineState()}
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup key={this.state.key}>
                                    <DescriptionListTerm>Status</DescriptionListTerm>
                                    <DescriptionListDescription>
                                        <Flex direction={{default: "row"}}>
                                            {environments.filter(e => e !== undefined)
                                                .map(e =>
                                                    <FlexItem key={e}>
                                                        <Tooltip content={"Last update: " + (status ? new Date(status.lastUpdate).toISOString() : "N/A")}
                                                                 position={"bottom"}>
                                                            <Badge className={this.isUp(e) ? "badge-env-up" : ""} isRead>{e}</Badge>
                                                        </Tooltip>
                                                    </FlexItem>)}
                                        </Flex>
                                    </DescriptionListDescription>
                                </DescriptionListGroup>
                            </DescriptionList>
                        </FlexItem>
                        <FlexItem>
                            <Flex direction={{default: "column"}}>
                                <FlexItem>
                                    {this.pushButton()}
                                </FlexItem>
                                <FlexItem>
                                    {this.buildButton()}
                                </FlexItem>
                                <FlexItem>
                                    <Button isSmall style={{visibility: "hidden"}}>Refresh</Button>
                                </FlexItem>
                            </Flex>
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        )
    }
}
