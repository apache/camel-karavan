import React from 'react';
import {
    Badge,
    Button,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription,
    Card,
    CardBody, Spinner, Tooltip, Flex, FlexItem, Divider, LabelGroup, Label, Modal
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {KaravanApi} from "../api/KaravanApi";
import {DeploymentStatus, Project, ProjectStatus} from "../models/ProjectModels";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import RolloutIcon from "@patternfly/react-icons/dist/esm/icons/process-automation-icon";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";

interface Props {
    project: Project,
    config: any,
    showLog: (type: 'container' | 'pipeline', name: string, environment: string) => void
    deleteEntity: (type: 'pod' | 'deployment', name: string, environment: string) => void
}

interface State {
    project?: Project,
    status?: ProjectStatus,
    isPushing: boolean,
    isBuilding: boolean,
    isRolling: boolean,
    showDeleteConfirmation: boolean,
    deleteEntity?: 'pod' | 'deployment',
    deleteEntityName?: string,
    deleteEntityEnv?: string,
    environments: string[],
    environment: string,
    key?: string,
}

export class ProjectInfo extends React.Component<Props, State> {

    public state: State = {
        project: this.props.project,
        isPushing: false,
        isBuilding: false,
        isRolling: false,
        showDeleteConfirmation: false,
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
        KaravanApi.pipelineRun(this.props.project, this.state.environment, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isBuilding: false});
                this.onRefresh();
            } else {
                // Todo notification
            }
        });
    }

    rollout = () => {
        this.setState({isRolling: true});
        KaravanApi.rolloutDeployment(this.props.project.projectId, this.state.environment, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isRolling: false});
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

    buildButton = (env: string) => {
        const isDeploying = this.state.isBuilding;
        const isPushing = this.state.isPushing;
        const status = this.state.status?.statuses.find(s => s.environment === env)
        const pipelineResult = status?.lastPipelineRunResult;
        const isRunning = pipelineResult === 'Running';
        return (<Tooltip content="Commit, push, build and deploy" position={"left"}>
            <Button isLoading={isDeploying ? true : undefined}
                    isDisabled={isDeploying || isRunning || isPushing}
                    isSmall
                    variant="secondary"
                    className="project-button"
                    icon={!isDeploying ? <BuildIcon/> : <div></div>}
                    onClick={e => {
                        this.push(() => this.build());
                    }}>
                {isDeploying ? "..." : "Deploy"}
            </Button>
        </Tooltip>)
    }

    rolloutButton = () => {
        const isRolling = this.state.isRolling;
        return (<Tooltip content="Rollout deployment" position={"left"}>
            <Button isLoading={isRolling ? true : undefined} isSmall variant="secondary"
                    className="project-button"
                    icon={!isRolling ? <RolloutIcon/> : <div></div>}
                    onClick={e => this.rollout()}>
                {isRolling ? "..." : "Rollout"}
            </Button>
        </Tooltip>)
    }

    deleteDeploymentButton = (env: string) => {
        return (<Tooltip content="Delete deployment" position={"left"}>
            <Button isSmall variant="secondary"
                    className="project-button"
                    icon={<DeleteIcon/>}
                    onClick={e => this.setState({
                        showDeleteConfirmation: true,
                        deleteEntity: "deployment",
                        deleteEntityEnv: env,
                        deleteEntityName: this.state.project?.projectId
                    })}>
                {"Delete"}
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
                    <DescriptionListTerm>Pipeline</DescriptionListTerm>
                    <DescriptionListDescription>
                        {this.getPipelineState(env)}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Deployment</DescriptionListTerm>
                    <DescriptionListDescription>
                        {deploymentStatus && this.getReplicasPanel(deploymentStatus, env)}
                    </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                    <DescriptionListTerm>Pods</DescriptionListTerm>
                    <DescriptionListDescription>
                        {deploymentStatus && this.getPodsPanel(deploymentStatus, env)}
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

    getReplicasPanel(deploymentStatus: DeploymentStatus, env: string) {
        const ok = (deploymentStatus && deploymentStatus?.readyReplicas > 0
            && deploymentStatus.unavailableReplicas === 0
            && deploymentStatus?.replicas === deploymentStatus?.readyReplicas)
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
            <LabelGroup numLabels={3}>
                <Tooltip content={"Ready Replicas / Replicas"} position={"left"}>
                    <Label icon={ok ? <UpIcon/> : <DownIcon/>}
                           color={ok ? "green" : "grey"}>{"Replicas: " + deploymentStatus.readyReplicas + " / " + deploymentStatus.replicas}</Label>
                </Tooltip>
                {deploymentStatus.unavailableReplicas > 0 &&
                    <Tooltip content={"Unavailable replicas"} position={"right"}>
                        <Label icon={<DownIcon/>} color={"red"}>{deploymentStatus.unavailableReplicas}</Label>
                    </Tooltip>
                }
            </LabelGroup>
                </FlexItem>
                <FlexItem>{env === "dev" && this.deleteDeploymentButton(env)}</FlexItem>
            </Flex>
        )
    }

    getPodsPanel(deploymentStatus: DeploymentStatus, env: string) {
        const podStatuses = deploymentStatus.podStatuses;
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
                    <LabelGroup numLabels={3}>
                        {(podStatuses === undefined || podStatuses.length === 0) && <Label icon={<DownIcon/>} color={"grey"}>No pods</Label>}
                        {podStatuses.map(pod => {
                                const running = pod.started && pod.ready;
                                return (
                                    <Tooltip content={running ? "Running" : pod.reason}>
                                        <Label icon={running ? <UpIcon/> : <DownIcon/>} color={running ? "green" : "red"}>
                                            <Button variant="link"
                                                    onClick={e => this.props.showLog?.call(this, 'container', pod.name, env)}>
                                                {pod.name}
                                            </Button>
                                            <Tooltip content={"Delete Pod"}>
                                                <Button icon={<DeleteIcon/>} variant="link" onClick={e => this.setState({
                                                    showDeleteConfirmation: true,
                                                    deleteEntity: "pod",
                                                    deleteEntityEnv: env,
                                                    deleteEntityName: pod.name
                                                })}></Button>
                                            </Tooltip>
                                        </Label>
                                    </Tooltip>
                                )
                            }
                        )}
                    </LabelGroup>
                </FlexItem>
                <FlexItem>{env === "dev" && this.rolloutButton()}</FlexItem>
            </Flex>
        )
    }

    getStatusColor(status?: string) {
        if (status === 'UP') return 'green';
        if (status === 'DOWN') return 'red';
        if (status === 'NA') return 'blue';
    }

    getStatusIcon(status?: string) {
        return (status === 'UP' ? <UpIcon/> : <DownIcon/>)
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
                {contextVersion &&
                    <Label icon={this.getStatusIcon(contextStatus)} color={this.getStatusColor(contextStatus)}>{contextVersion}</Label>}
                <Label icon={this.getStatusIcon(contextStatus)} color={this.getStatusColor(contextStatus)}>Context</Label>
                <Label icon={this.getStatusIcon(consumersStatus)} color={this.getStatusColor(consumersStatus)}>Consumers</Label>
                <Label icon={this.getStatusIcon(routesStatus)} color={this.getStatusColor(routesStatus)}>Routes</Label>
                {registryStatus !== 'NA' &&
                    <Label icon={this.getStatusIcon(registryStatus)} color={this.getStatusColor(registryStatus)}>Registry</Label>}
            </LabelGroup>
        )
    }

    getPipelineState(env: string) {
        const status = this.state.status?.statuses.find(s => s.environment === env)
        const pipeline = status?.lastPipelineRun;
        const pipelineResult = status?.lastPipelineRunResult;
        const lastPipelineRunTime = status?.lastPipelineRunTime;
        const showTime = lastPipelineRunTime && lastPipelineRunTime > 0;
        const isRunning = pipelineResult === 'Running';
        const isFailed = pipelineResult === 'Failed';
        const isSucceeded = pipelineResult === 'Succeeded';
        const color = isSucceeded ? "green" : (isFailed ? "red" : (isRunning ? "blue" : "grey"))
        const icon = isSucceeded ? <UpIcon/> : <DownIcon/>
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
                    <Tooltip content={pipelineResult} position={"right"}>
                        <LabelGroup numLabels={2}>
                            <Label icon={isRunning ? <Spinner isSVG diameter="16px"/> : icon} color={color}>
                                <Button variant="link" onClick={e => {
                                    if (pipeline) this.props.showLog?.call(this, 'pipeline', pipeline, env);
                                }}>
                                    {pipeline ? pipeline : "-"}
                                </Button>
                            </Label>
                            {showTime && <Label icon={<ClockIcon/>} color={color}>{lastPipelineRunTime + "s"}</Label>}
                        </LabelGroup>
                    </Tooltip>
                </FlexItem>
                <FlexItem>{env === "dev" && this.buildButton(env)}</FlexItem>
            </Flex>
        )
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
            <DescriptionListGroup>
                <DescriptionListTerm>Commit</DescriptionListTerm>
                <DescriptionListDescription>
                    {this.getCommitPanel()}
                </DescriptionListDescription>
            </DescriptionListGroup>
        </DescriptionList>)
    }

    getDeleteConfirmation() {
        const {deleteEntity, deleteEntityEnv, deleteEntityName} = this.state;
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (deleteEntityEnv && deleteEntityName && deleteEntity) {
                        this.props.deleteEntity?.call(this, deleteEntity, deleteEntityName, deleteEntityEnv);
                        this.setState({showDeleteConfirmation: false});
                    }
                }}>Delete
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>{"Delete " + deleteEntity + " " + deleteEntityName + "?"}</div>
        </Modal>)
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
                {this.state.showDeleteConfirmation && this.getDeleteConfirmation()}
            </Card>
        )
    }
}
