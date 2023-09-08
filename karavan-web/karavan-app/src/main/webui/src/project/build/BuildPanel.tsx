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
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import TagIcon from "@patternfly/react-icons/dist/esm/icons/tag-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {useAppConfigStore, useLogStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainersPanel} from "./ContainersPanel";

interface Props {
    env: string,
}

export function BuildPanel (props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [containers, deployments, camels, pipelineStatuses] =
        useStatusesStore((s) => [s.containers, s.deployments, s.camels, s.pipelineStatuses], shallow);
    const [isPushing, setIsPushing] = useState<boolean>(false);
    const [isBuilding, setIsBuilding] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityType, setDeleteEntityType] = useState<'pod' | 'deployment' | 'build'>('pod');
    const [deleteEntityName, setDeleteEntityName] = useState<string>();
    const [deleteEntityEnv, setDeleteEntityEnv] = useState<string>();
    const [tag, setTag] = useState<string>(new Date().toISOString().substring(0,19).replaceAll(':', '-'));

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
        KaravanApi.buildProject(project, tag, res => {
            if (res.status === 200 || res.status === 201) {
                setIsBuilding(false);
            } else {
                // Todo notification
            }
        });
    }

    function buildButton(env: string) {
        const status = pipelineStatuses.filter(p => p.projectId === project.projectId).at(0);
        const isRunning = status?.result === 'Running';
        return (<Tooltip content="Start build" position={"left"}>
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
        const status = containers.filter(c => c.projectId === project.projectId && c.type === 'build').at(0);
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
                    <LabelGroup numLabels={3}>
                        <Label isEditable={!isRunning} onEditComplete={(_, v) => setTag(v)}
                               icon={<TagIcon className="not-spinner"/>}
                               color={color}>{tag}</Label>
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
                <DescriptionList isHorizontal horizontalTermWidthModifier={{default: '20ch'}}>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Environment</DescriptionListTerm>
                        <DescriptionListDescription>
                            <Badge className="badge">{env}</Badge>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Build container with tag</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getBuildState(env)}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    {config.infrastructure === 'kubernetes' &&
                        <DescriptionListGroup>
                        <DescriptionListTerm>Deployment</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getReplicasPanel(env)}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    }
                    <DescriptionListGroup>
                        <DescriptionListTerm>Containers</DescriptionListTerm>
                        <DescriptionListDescription>
                            <ContainersPanel env={props.env}/>
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </CardBody>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </Card>
    )
}
