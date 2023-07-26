import React from 'react';
import {
    Button,
    DescriptionList,
    DescriptionListTerm,
    DescriptionListGroup,
    DescriptionListDescription, Spinner, Tooltip, Flex, FlexItem, LabelGroup, Label, Modal, Badge, CardBody, Card
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {KaravanApi} from "../../api/KaravanApi";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import RolloutIcon from "@patternfly/react-icons/dist/esm/icons/process-automation-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {CamelStatus, DeploymentStatus, PipelineStatus, ContainerStatus, Project} from "../../api/ProjectModels";
import {useLogStore} from "../../api/ProjectStore";

interface Props {
    project: Project,
    config: any,
    env: string,
}

interface State {
    pipelineStatus?: PipelineStatus,
    deploymentStatus?: DeploymentStatus,
    podStatuses: ContainerStatus[],
    camelStatus?: CamelStatus,
    isPushing: boolean,
    isBuilding: boolean,
    isRolling: boolean,
    showDeleteConfirmation: boolean,
    deleteEntity?: 'pod' | 'deployment' | 'pipelinerun',
    deleteEntityName?: string,
    deleteEntityEnv?: string,
}

export class ProjectStatus extends React.Component<Props, State> {

    public state: State = {
        podStatuses: [],
        isPushing: false,
        isBuilding: false,
        isRolling: false,
        showDeleteConfirmation: false,
    };
    interval: any;

    componentDidMount() {
        this.interval = setInterval(() => this.onRefreshStatus(), 700);
    }

    componentWillUnmount() {
        clearInterval(this.interval);
    }

    onRefreshStatus = () => {
        const projectId = this.props.project.projectId;
        const env = this.props.env;
        if (this.props.project) {
            KaravanApi.getProjectPipelineStatus(projectId, env, (status?: PipelineStatus) => {
                this.setState({pipelineStatus: status});
            });
            KaravanApi.getProjectDeploymentStatus(projectId, env, (status?: DeploymentStatus) => {
                this.setState({deploymentStatus: status});
            });
            KaravanApi.getProjectPodStatuses(projectId, env, (statuses: ContainerStatus[]) => {
                this.setState({podStatuses: statuses});
            });
            KaravanApi.getProjectCamelStatus(projectId, env, (status: CamelStatus) => {
                this.setState({camelStatus: status});
            });
        }
    }

    deleteEntity = (type: 'pod' | 'deployment' | 'pipelinerun', name: string, environment: string) => {
        switch (type) {
            case "deployment":
                KaravanApi.deleteDeployment(environment, name, (res: any) => {
                    // if (Array.isArray(res) && Array.from(res).length > 0)
                    // this.onRefresh();
                });
                break;
            case "pod":
                KaravanApi.deleteContainer(environment, name, (res: any) => {
                    // if (Array.isArray(res) && Array.from(res).length > 0)
                    // this.onRefresh();
                });
                break;
            case "pipelinerun":
                KaravanApi.stopPipelineRun(environment, name, (res: any) => {
                    // if (Array.isArray(res) && Array.from(res).length > 0)
                    // this.onRefresh();
                });
                break;
        }
    }

    build = () => {
        this.setState({isBuilding: true});
        KaravanApi.pipelineRun(this.props.project, this.props.env, res => {
            if (res.status === 200 || res.status === 201) {
                this.setState({isBuilding: false});
            } else {
                // Todo notification
            }
        });
    }

    rollout = () => {
        this.setState({isRolling: true});
        KaravanApi.rolloutDeployment(this.props.project.projectId, this.props.env, res => {
            console.log(res)
            if (res.status === 200 || res.status === 201) {
                this.setState({isRolling: false});
            } else {
                // Todo notification
            }
        });
    }

    buildButton = (env: string) => {
        const {isBuilding, isPushing, pipelineStatus} = this.state;
        const isRunning = pipelineStatus?.result === 'Running';
        return (<Tooltip content="Start build pipeline" position={"left"}>
            <Button isLoading={isBuilding ? true : undefined}
                    isDisabled={isBuilding || isRunning || isPushing}
                    isSmall
                    variant="secondary"
                    className="project-button"
                    icon={!isBuilding ? <BuildIcon/> : <div></div>}
                    onClick={e => this.build()}>
                {isBuilding ? "..." : "Build"}
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
                        deleteEntityName: this.props.project?.projectId
                    })}>
                {"Delete"}
            </Button>
        </Tooltip>)
    }

    getReplicasPanel(env: string, deploymentStatus?: DeploymentStatus) {
        const ok = (deploymentStatus && deploymentStatus?.readyReplicas > 0
            && (deploymentStatus.unavailableReplicas === 0 || deploymentStatus.unavailableReplicas === undefined || deploymentStatus.unavailableReplicas === null)
            && deploymentStatus?.replicas === deploymentStatus?.readyReplicas)
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
                    {deploymentStatus && <LabelGroup numLabels={3}>
                        <Tooltip content={"Ready Replicas / Replicas"} position={"left"}>
                            <Label icon={ok ? <UpIcon/> : <DownIcon/>}
                                   color={ok ? "green" : "grey"}>{"Replicas: " + deploymentStatus.readyReplicas + " / " + deploymentStatus.replicas}</Label>
                        </Tooltip>
                        {deploymentStatus.unavailableReplicas > 0 &&
                            <Tooltip content={"Unavailable replicas"} position={"right"}>
                                <Label icon={<DownIcon/>} color={"red"}>{deploymentStatus.unavailableReplicas}</Label>
                            </Tooltip>
                        }
                    </LabelGroup>}
                    {deploymentStatus === undefined && <Label icon={<DownIcon/>} color={"grey"}>No deployments</Label>}
                </FlexItem>
                <FlexItem>{env === "dev" && this.deleteDeploymentButton(env)}</FlexItem>
            </Flex>
        )
    }

    getPodsPanel(env: string, podStatuses: ContainerStatus[]) {
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}}
                  alignItems={{default: "alignItemsFlexStart"}}>
                <FlexItem>
                    {podStatuses.length === 0 && <Label icon={<DownIcon/>} color={"grey"}>No pods</Label>}
                    <LabelGroup numLabels={2} isVertical>
                        {podStatuses.map(pod => {
                                const ready = pod.lifeCycle === 'ready';
                                return (
                                    <Tooltip key={pod.containerName} content={pod.lifeCycle}>
                                        <Label icon={ready ? <UpIcon/> : <DownIcon/>} color={ready ? "green" : "red"}>
                                            <Button variant="link"
                                                    onClick={e => {
                                                        useLogStore.setState({
                                                            showLog: true,
                                                            type: 'container',
                                                            podName: pod.containerName,
                                                            isRunning: true
                                                        });
                                                    }}>
                                                {pod.containerName}
                                            </Button>
                                            <Tooltip content={"Delete Pod"}>
                                                <Button icon={<DeleteIcon/>} variant="link" onClick={e => this.setState({
                                                    showDeleteConfirmation: true,
                                                    deleteEntity: "pod",
                                                    deleteEntityEnv: env,
                                                    deleteEntityName: pod.containerName
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
        if (status === 'UNDEFINED') return 'grey';
    }

    getStatusIcon(status?: string) {
        return (status === 'UP' ? <UpIcon/> : <DownIcon/>)
    }

    getHealthPanel(env: string) {
        const status = this.state.camelStatus;
        // const routesStatus = status?.routesStatus;
        // const consumersStatus = status?.consumerStatus;
        // const contextStatus = status?.contextStatus;
        // const contextVersion = status?.contextVersion;
        return (
            <LabelGroup numLabels={4}>
                {/*{contextVersion &&*/}
                {/*    <Label icon={this.getStatusIcon(contextStatus)}*/}
                {/*           color={this.getStatusColor(contextStatus)}>{contextVersion}</Label>}*/}
                {/*<Label icon={this.getStatusIcon(contextStatus)}*/}
                {/*       color={this.getStatusColor(contextStatus)}>Context</Label>*/}
                {/*<Label icon={this.getStatusIcon(consumersStatus)}*/}
                {/*       color={this.getStatusColor(consumersStatus)}>Consumers</Label>*/}
                {/*<Label icon={this.getStatusIcon(routesStatus)} color={this.getStatusColor(routesStatus)}>Routes</Label>*/}
            </LabelGroup>
        )
    }

    getPipelineState(env: string) {
        const status = this.state.pipelineStatus;
        const pipeline = status?.pipelineName;
        const pipelineResult = status?.result;
        let lastPipelineRunTime = 0;
        if (status?.startTime) {
            const start: Date = new Date(status.startTime);
            const finish: Date = status.completionTime !== undefined && status.completionTime !== null ? new Date(status.completionTime) : new Date();
            lastPipelineRunTime = Math.round((finish.getTime() - start.getTime()) / 1000);
        }
        const showTime = lastPipelineRunTime && lastPipelineRunTime > 0;
        const isRunning = pipelineResult === 'Running';
        const isFailed = pipelineResult === 'Failed';
        const isSucceeded = pipelineResult === 'Succeeded';
        const color = isSucceeded ? "green" : (isFailed ? "red" : (isRunning ? "blue" : "grey"))
        const icon = isSucceeded ? <UpIcon className="not-spinner"/> : <DownIcon className="not-spinner"/>
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
                    <Tooltip content={pipelineResult} position={"right"}>
                        <LabelGroup numLabels={2}>
                            <Label icon={isRunning ? <Spinner isSVG diameter="16px" className="spinner"/> : icon} color={color}>
                                {pipeline
                                    ? <Button variant="link" onClick={e =>
                                        useLogStore.setState({showLog: true, type: 'pipeline', podName: pipeline, isRunning: true})
                                    }>
                                        {pipeline}
                                    </Button>
                                    : "No pipeline"}
                                {isRunning && <Tooltip content={"Stop PipelineRun"}>
                                    <Button icon={<DeleteIcon/>} variant="link" onClick={e =>
                                        this.setState({
                                            showDeleteConfirmation: true,
                                            deleteEntity: "pipelinerun",
                                            deleteEntityEnv: env,
                                            deleteEntityName: pipeline
                                        })
                                    }></Button>
                                </Tooltip>}
                            </Label>
                            {pipeline !== undefined && showTime === true && lastPipelineRunTime !== undefined &&
                                <Label icon={<ClockIcon className="not-spinner"/>} color={color}>{lastPipelineRunTime + "s"}</Label>}
                        </LabelGroup>
                    </Tooltip>
                </FlexItem>
                <FlexItem>{env === "dev" && this.buildButton(env)}</FlexItem>
            </Flex>
        )
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
                        this.deleteEntity(deleteEntity, deleteEntityName, deleteEntityEnv);
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
        const {deploymentStatus, podStatuses} = this.state;
        const {env} = this.props;
        return (
            <Card className="project-status">
                <CardBody>
                    <DescriptionList isHorizontal>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Environment</DescriptionListTerm>
                            <DescriptionListDescription>
                                <Badge className="badge">{env}</Badge>
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Pipeline</DescriptionListTerm>
                            <DescriptionListDescription>
                                {this.getPipelineState(env)}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Deployment</DescriptionListTerm>
                            <DescriptionListDescription>
                                {this.getReplicasPanel(env, deploymentStatus)}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Pods</DescriptionListTerm>
                            <DescriptionListDescription>
                                {this.getPodsPanel(env, podStatuses)}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                            <DescriptionListTerm>Camel health</DescriptionListTerm>
                            <DescriptionListDescription>
                                {this.getHealthPanel(env)}
                            </DescriptionListDescription>
                        </DescriptionListGroup>
                    </DescriptionList>
                </CardBody>
                {this.state.showDeleteConfirmation && this.getDeleteConfirmation()}
            </Card>
        )
    }
}
