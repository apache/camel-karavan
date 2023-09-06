import React, {useState} from 'react';
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
import {ContainerStatus} from "../../api/ProjectModels";
import {useLogStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";

interface Props {
    env: string,
}

export function BuildStatus (props: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [containers, deployments, camels, pipelineStatuses] =
        useStatusesStore((s) => [s.containers, s.deployments, s.camels, s.pipelineStatuses], shallow);
    const [isPushing, setIsPushing] = useState<boolean>(false);
    const [isBuilding, setIsBuilding] = useState<boolean>(false);
    const [isRolling, setIsRolling] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityType, setDeleteEntityType] = useState<'pod' | 'deployment' | 'build'>('pod');
    const [deleteEntityName, setDeleteEntityName] = useState<string>();
    const [deleteEntityEnv, setDeleteEntityEnv] = useState<string>();

    function deleteEntity(type: 'pod' | 'deployment' | 'build', name: string, environment: string) {
        switch (type) {
            case "deployment":
                KaravanApi.deleteDeployment(environment, name, (res: any) => {
                    // if (Array.isArray(res) && Array.from(res).length > 0)
                    // onRefresh();
                });
                break;
            case "pod":
                KaravanApi.deleteContainer(environment, 'project', name, (res: any) => {
                    // if (Array.isArray(res) && Array.from(res).length > 0)
                    // onRefresh();
                });
                break;
            case "build":
                KaravanApi.stopBuild(environment, name, (res: any) => {
                    // if (Array.isArray(res) && Array.from(res).length > 0)
                    // onRefresh();
                });
                break;
        }
    }

    function build() {
        setIsBuilding(true);
        setShowLog(false,'none')
        KaravanApi.buildProject(project, env, res => {
            if (res.status === 200 || res.status === 201) {
                setIsBuilding(false);
            } else {
                // Todo notification
            }
        });
    }

    function rollout() {
        setIsRolling(true);
        KaravanApi.rolloutDeployment(project.projectId, env, res => {
            if (res.status === 200 || res.status === 201) {
                setIsRolling(false);
            } else {
                // Todo notification
            }
        });
    }

    function buildButton(env: string) {
        const status = pipelineStatuses.filter(p => p.projectId === project.projectId).at(0);
        const isRunning = status?.result === 'Running';
        return (<Tooltip content="Start build pipeline" position={"left"}>
            <Button isLoading={isBuilding ? true : undefined}
                    isDisabled={isBuilding || isRunning || isPushing}
                    size="sm"
                    variant="secondary"
                    className="project-button"
                    icon={!isBuilding ? <BuildIcon/> : <div></div>}
                    onClick={e => build()}>
                {isBuilding ? "..." : "Build"}
            </Button>
        </Tooltip>)
    }

    function rolloutButton() {
        return (<Tooltip content="Rollout deployment" position={"left"}>
            <Button isLoading={isRolling ? true : undefined} size="sm" variant="secondary"
                    className="project-button"
                    icon={!isRolling ? <RolloutIcon/> : <div></div>}
                    onClick={e => rollout()}>
                {isRolling ? "..." : "Rollout"}
            </Button>
        </Tooltip>)
    }

    function deleteDeploymentButton(env: string) {
        return (<Tooltip content="Delete deployment" position={"left"}>
            <Button size="sm" variant="secondary"
                    className="project-button"
                    icon={<DeleteIcon/>}
                    onClick={e => {
                        setShowDeleteConfirmation(true);
                        setDeleteEntityType("deployment");
                        setDeleteEntityEnv(env);
                        setDeleteEntityName(project?.projectId);
                    }}>
                {"Delete"}
            </Button>
        </Tooltip>)
    }

    function getReplicasPanel(env: string) {
        const deploymentStatus = deployments.find(d => d.name === project?.projectId);
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
                <FlexItem>{env === "dev" && deleteDeploymentButton(env)}</FlexItem>
            </Flex>
        )
    }

    function getPodsPanel(env: string) {
        const podStatuses = containers.filter(d => d.projectId === project?.projectId && d.type === 'project');
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}}
                  alignItems={{default: "alignItemsFlexStart"}}>
                <FlexItem>
                    {podStatuses.length === 0 && <Label icon={<DownIcon/>} color={"grey"}>No pods</Label>}
                    <LabelGroup numLabels={2} isVertical>
                        {podStatuses.map((pod: ContainerStatus) => {
                                const ready = pod.state === 'running';
                                return (
                                    <Tooltip key={pod.containerName} content={pod.state}>
                                        <Label icon={ready ? <UpIcon/> : <DownIcon/>} color={ready ? "green" : "red"}>
                                            <Button variant="link" className="labeled-button"
                                                    onClick={e => {
                                                        setShowLog(true,'container', pod.containerName);
                                                    }}>
                                                {pod.containerName}
                                            </Button>
                                            <Tooltip content={"Delete Pod"}>
                                                <Button icon={<DeleteIcon/>}
                                                        className="labeled-button"
                                                        variant="link"
                                                        onClick={e => {
                                                            setShowDeleteConfirmation(true);
                                                            setDeleteEntityType("pod");
                                                            setDeleteEntityEnv(env);
                                                            setDeleteEntityName(pod.containerName);
                                                        }}></Button>
                                            </Tooltip>
                                        </Label>
                                    </Tooltip>
                                )
                            }
                        )}
                    </LabelGroup>
                </FlexItem>
                <FlexItem>{env === "dev" && rolloutButton()}</FlexItem>
            </Flex>
        )
    }

    function getPipelineState(env: string) {
        const status = pipelineStatuses.filter(p => p.projectId === project.projectId).at(0);
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
                            <Label icon={isRunning ? <Spinner diameter="16px" className="spinner"/> : icon}
                                   color={color}>
                                {pipeline
                                    ? <Button className='labeled-button' variant="link" onClick={e =>
                                        useLogStore.setState({showLog: true, type: 'build', podName: pipeline})
                                    }>
                                        {pipeline}
                                    </Button>
                                    : "No builder"}
                                {isRunning && <Tooltip content={"Stop build"}>
                                    <Button
                                        icon={<DeleteIcon/>}
                                        className="labeled-button"
                                        variant="link" onClick={e => {
                                        setShowDeleteConfirmation(true);
                                        setDeleteEntityType("build");
                                        setDeleteEntityEnv(env);
                                        setDeleteEntityName(pipeline);
                                    }}></Button>
                                </Tooltip>}
                            </Label>
                            {pipeline !== undefined && showTime === true && lastPipelineRunTime !== undefined &&
                                <Label icon={<ClockIcon className="not-spinner"/>}
                                       color={color}>{lastPipelineRunTime + "s"}</Label>}
                        </LabelGroup>
                    </Tooltip>
                </FlexItem>
                <FlexItem>{env === "dev" && buildButton(env)}</FlexItem>
            </Flex>
        )
    }

    function getBuildState(env: string) {
        const status = containers.filter(c => c.projectId === project.projectId).at(0);
        const buildName = status?.containerName;
        const state = status?.state;
        let buildTime = 0;
        if (status?.created) {
            const start: Date = new Date(status.created);
            const finish: Date = status.finished !== undefined && status.finished !== null ? new Date(status.finished) : new Date();
            buildTime = Math.round((finish.getTime() - start.getTime()) / 1000);
        }
        const showTime = buildTime && buildTime > 0;
        const isRunning = state === 'running';
        const isExited = state === 'exited';
        const color = isExited ? "grey" : (isRunning ? "blue" : "grey");
        const icon = isExited ? <UpIcon className="not-spinner"/> : <DownIcon className="not-spinner"/>
        return (
            <Flex justifyContent={{default: "justifyContentSpaceBetween"}} alignItems={{default: "alignItemsCenter"}}>
                <FlexItem>
                    <LabelGroup numLabels={2}>
                        <Label icon={isRunning ? <Spinner diameter="16px" className="spinner"/> : icon}
                               color={color}>
                            {buildName
                                ? <Button className='labeled-button' variant="link" onClick={e =>
                                    useLogStore.setState({showLog: true, type: 'build', podName: buildName})
                                }>
                                    {buildName}
                                </Button>
                                : "No builder"}
                            {status !== undefined && <Tooltip content={"Delete build"}>
                                <Button
                                    icon={<DeleteIcon/>}
                                    className="labeled-button"
                                    variant="link" onClick={e => {
                                    setShowDeleteConfirmation(true);
                                    setDeleteEntityType("build");
                                    setDeleteEntityEnv(env);
                                    setDeleteEntityName(buildName);
                                }}></Button>
                            </Tooltip>}
                        </Label>
                        {buildName !== undefined && showTime === true && buildTime !== undefined &&
                            <Label icon={<ClockIcon className="not-spinner"/>}
                                   color={color}>{buildTime + "s"}</Label>}
                    </LabelGroup>
                </FlexItem>
                <FlexItem>{env === "dev" && buildButton(env)}</FlexItem>
            </Flex>
        )
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (deleteEntityEnv && deleteEntityName && deleteEntity) {
                        deleteEntity(deleteEntityType, deleteEntityName, deleteEntityEnv);
                        setShowDeleteConfirmation(false);
                    }
                }}>Delete
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>{"Delete " + deleteEntityType + " " + deleteEntityName + "?"}</div>
        </Modal>)
    }

    const env = props.env;
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
                        <DescriptionListTerm>Build container</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getBuildState(env)}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Deployment</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getReplicasPanel(env)}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Pods</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getPodsPanel(env)}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </CardBody>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </Card>
    )
}
