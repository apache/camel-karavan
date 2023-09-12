import React, {useState} from 'react';
import {
    Badge,
    Button,
    Card,
    CardBody,
    DescriptionList,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Flex,
    FlexItem,
    Label,
    LabelGroup, Modal,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {useAppConfigStore, useLogStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerStatus} from "../../api/ProjectModels";
import {ContainerButtons} from "./ContainerButtons";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {KaravanApi} from "../../api/KaravanApi";
import {EventBus} from "../../designer/utils/EventBus";

interface Props {
    env: string,
}

export function DeploymentPanel (props: Props) {

    const {config} = useAppConfigStore();
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [ deployments] =
        useStatusesStore((s) => [s.deployments], shallow);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityName, setDeleteEntityName] = useState<string>();

    function deleteEntity() {
        if (deleteEntityName) {
            KaravanApi.deleteDeployment(props.env, deleteEntityName, (res: any) => {
                if (res.status === 200) {
                    EventBus.sendAlert("Deployment deleted", "Deployment deleted: " + deleteEntityName, 'info');
                }
            });
        }
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (deleteEntityName) {
                        deleteEntity();
                        setShowDeleteConfirmation(false);
                    }
                }}>Delete
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>{"Delete deployment " + deleteEntityName + "?"}</div>
        </Modal>)
    }

    function deleteDeploymentButton() {
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

    const deploymentStatus = deployments.find(d => d.projectId === project?.projectId);
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
            <FlexItem>{props.env === "dev" && deleteDeploymentButton()}</FlexItem>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </Flex>
    )
}
