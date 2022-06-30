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
    CardBody, Spinner, Tooltip, Flex, FlexItem, Divider, LabelGroup, Label
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {DeploymentStatus, Project, ProjectStatus} from "../models/ProjectModels";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";

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

export class ProjectInfo extends React.Component<Props, State> {

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
        this.interval = setInterval(() => this.onRefreshStatus(), 700);
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

    getCommitPanel() {
        const {project} = this.state;
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
                    <Tooltip content={project?.lastCommit} position={"right"}>
                        <Badge>{project?.lastCommit ? project?.lastCommit?.substr(0, 7) : "-"}</Badge>
                    </Tooltip>
                </FlexItem>
                <FlexItem>
                    {this.pushButton()}
                </FlexItem>
            </Flex>)
    }

    getEnvPanel(env: string) {
        const {status} = this.state;
        const deploymentStatus = status?.statuses.find(s => s.environment === env)?.deploymentStatus;
        return (
            <DescriptionList isHorizontal>
                <DescriptionListGroup>
                    <DescriptionListTerm>Commit</DescriptionListTerm>
                    <DescriptionListDescription>
                        {this.getCommitPanel()}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Pipeline</DescriptionListTerm>
                    <DescriptionListDescription>
                        {this.getPipelineState(env)}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Replicas</DescriptionListTerm>
                    <DescriptionListDescription>
                        {deploymentStatus && this.getReplicasPanel(deploymentStatus)}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Camel health</DescriptionListTerm>
                    <DescriptionListDescription>
                        {this.getHealthPanel("dev")}
                    </DescriptionListDescription>
                </DescriptionListGroup>
            </DescriptionList>)
    }

    getReplicasPanel(deploymentStatus: DeploymentStatus) {
        const ok = (deploymentStatus && deploymentStatus?.readyReplicas > 0
            && deploymentStatus.unavailableReplicas === 0
            && deploymentStatus?.replicas === deploymentStatus?.readyReplicas)
        return (
            <LabelGroup numLabels={3}>
                <Tooltip content={"Ready Replicas / Replicas"} position={"left"}>
                    <Label icon={<UpIcon/>}
                           color={ok ? "green" : "grey"}>{deploymentStatus.readyReplicas + " / " + deploymentStatus.replicas}</Label>
                </Tooltip>
                {deploymentStatus.unavailableReplicas > 0 &&
                    <Tooltip content={"Unavailable replicas"} position={"right"}>
                        <Label icon={<UpIcon/>} color={"red"}>{deploymentStatus.unavailableReplicas}</Label>
                    </Tooltip>
                }
            </LabelGroup>
        )
    }

    getHealthPanel(env: string) {
        const status = this.state.status?.statuses.find(s => s.environment === env)
        const registryStatus = status?.registryStatus;
        const routesStatus = status?.routesStatus;
        const consumersStatus = status?.consumerStatus;
        const contextStatus = status?.contextStatus;
        const contextVersion = status?.contextVersion;
        return (
            <LabelGroup numLabels={5}>
                <Label icon={<UpIcon/>} color={contextStatus === "UP" ? "green" : "grey"}>Context</Label>
                <Label icon={<UpIcon/>} color={contextStatus === "UP" ? "green" : "grey"}>{contextVersion}</Label>
                <Label icon={<UpIcon/>} color={consumersStatus === "UP" ? "green" : "grey"}>Consumers</Label>
                <Label icon={<UpIcon/>} color={routesStatus === "UP" ? "green" : "grey"}>Routes</Label>
                <Label icon={<UpIcon/>} color={registryStatus === "UP" ? "green" : "grey"}>Registry</Label>
            </LabelGroup>
        )
    }

    getPipelineState(env: string) {
        const status = this.state.status?.statuses.find(s => s.environment === env)
        const pipeline = status?.lastPipelineRun;
        const pipelineResult = status?.lastPipelineRunResult;
        const lastPipelineRunTime = status?.lastPipelineRunTime;
        const isRunning = pipelineResult === 'Running';
        const isFailed = pipelineResult === 'Failed';
        const isSucceeded = pipelineResult === 'Succeeded';
        const color = isSucceeded ? "green" : (isFailed ? "red" : (isRunning ? "blue" : "grey"))
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
                    <Tooltip content={pipelineResult} position={"right"}>
                        <LabelGroup numLabels={2}>
                            <Label icon={isRunning ? <Spinner isSVG diameter="16px"/> : <UpIcon/>}
                                   color={color}>{pipeline ? pipeline : "-"}</Label>
                            {lastPipelineRunTime && lastPipelineRunTime > 0 &&
                                <Label icon={<ClockIcon/>} color={color}>{lastPipelineRunTime + "s"}</Label>}
                        </LabelGroup>
                    </Tooltip>
                </FlexItem>
                <FlexItem>{env === "dev" && this.buildButton()}</FlexItem>
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

    getProjectDescription() {
        const {project} = this.state;
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
        </DescriptionList>)
    }

    render() {
        return (
            <Card>
                <CardBody>
                    <Flex direction={{default: "row"}}
                          style={{height: "200px"}}
                          justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem flex={{default: "flex_1"}}>
                            {this.getProjectDescription()}
                        </FlexItem>
                        <Divider orientation={{default: "vertical"}}/>
                        <FlexItem flex={{default: "flex_1"}}>
                            {this.getEnvPanel("dev")}
                        </FlexItem>
                    </Flex>
                </CardBody>
            </Card>
        )
    }
}
