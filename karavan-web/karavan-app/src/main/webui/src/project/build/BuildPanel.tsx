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
import {EventBus} from "../../designer/utils/EventBus";

export function BuildPanel () {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [containers, deployments, camels] =
        useStatusesStore((s) => [s.containers, s.deployments, s.camels], shallow);
    const [isPushing, setIsPushing] = useState<boolean>(false);
    const [isBuilding, setIsBuilding] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityName, setDeleteEntityName] = useState<string>();
    const [tag, setTag] = useState<string>(
        new Date().toISOString().substring(0,19).replaceAll(':', '').replaceAll('-', '')
    );

    function deleteEntity() {
        if (deleteEntityName) {
            KaravanApi.stopBuild('dev', deleteEntityName, (res: any) => {
                if (res.status === 200) {
                    EventBus.sendAlert("Build deleted", "Build deleted: " + deleteEntityName, 'info');
                }
            });
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

    function buildButton() {
        const status = containers.filter(c => c.projectId === project.projectId && c.type === 'build').at(0);
        const isRunning = status?.state === 'running';
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

    function getBuildState() {
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
                                    setDeleteEntityName(buildName);
                                }}></Button>
                            </Tooltip>}
                        </Label>
                        {buildName !== undefined && showTime === true && buildTime !== undefined &&
                            <Label icon={<ClockIcon className="not-spinner"/>}
                                   color={color}>{buildTime + "s"}</Label>}
                    </LabelGroup>
                </FlexItem>
                <FlexItem>{buildButton()}</FlexItem>
            </Flex>
        )
    }

    function getBuildTag() {
        const status = containers.filter(c => c.projectId === project.projectId && c.type === 'build').at(0);
        const state = status?.state;
        const isRunning = state === 'running';
        const isExited = state === 'exited';
        const color = isExited ? "grey" : (isRunning ? "blue" : "grey");
        return (
            <Label isEditable={!isRunning} onEditComplete={(_, v) => setTag(v)}
                   icon={<TagIcon className="not-spinner"/>}
                   color={color}>{tag}</Label>
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
                    if (deleteEntityName && deleteEntity) {
                        deleteEntity();
                        setShowDeleteConfirmation(false);
                    }
                }}>Delete
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>{"Delete build " + deleteEntityName + "?"}</div>
        </Modal>)
    }

    return (
        <Card className="project-status">
            <CardBody>
                <DescriptionList isHorizontal horizontalTermWidthModifier={{default: '20ch'}}>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Tag</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getBuildTag()}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                        <DescriptionListTerm>Build container</DescriptionListTerm>
                        <DescriptionListDescription>
                            {getBuildState()}
                        </DescriptionListDescription>
                    </DescriptionListGroup>
                </DescriptionList>
            </CardBody>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </Card>
    )
}
