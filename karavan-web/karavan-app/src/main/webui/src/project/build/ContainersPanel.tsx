import React, {useState} from 'react';
import {
    Button, Tooltip, Flex, FlexItem, LabelGroup, Label, Modal
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {KaravanApi} from "../../api/KaravanApi";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {ContainerStatus} from "../../api/ProjectModels";
import {useLogStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";

interface Props {
    env: string,
}

export function ContainersPanel (props: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [containers, deployments, camels, pipelineStatuses] =
        useStatusesStore((s) => [s.containers, s.deployments, s.camels, s.pipelineStatuses], shallow);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityName, setDeleteEntityName] = useState<string>();
    const [deleteEntityEnv, setDeleteEntityEnv] = useState<string>();

    function deleteContainer(name: string, environment: string) {
        KaravanApi.deleteContainer(environment, 'project', name, (res: any) => {
            // if (Array.isArray(res) && Array.from(res).length > 0)
            // onRefresh();
        });
    }

    function deleteButton(env: string) {
        return (<Tooltip content="Delete container" position={"left"}>
            <Button size="sm" variant="secondary"
                    className="project-button"
                    icon={<DeleteIcon/>}
                    onClick={e => {
                        setShowDeleteConfirmation(true);
                        setDeleteEntityEnv(env);
                        setDeleteEntityName(project?.projectId);
                    }}>
                {"Delete"}
            </Button>
        </Tooltip>)
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (deleteEntityEnv && deleteEntityName) {
                        deleteContainer(deleteEntityName, deleteEntityEnv);
                        setShowDeleteConfirmation(false);
                    }
                }}>Delete
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>{"Delete container " + deleteEntityName + "?"}</div>
        </Modal>)
    }

    const env = props.env;
    const conts = containers.filter(d => d.projectId === project?.projectId && d.type === 'project');
    return (
        <Flex justifyContent={{default: "justifyContentSpaceBetween"}}
              alignItems={{default: "alignItemsFlexStart"}}>
            <FlexItem>
                {conts.length === 0 && <Label icon={<DownIcon/>} color={"grey"}>No pods</Label>}
                <LabelGroup numLabels={2} isVertical>
                    {conts.map((pod: ContainerStatus) => {
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
                                        <Tooltip content={"Delete Container"}>
                                            <Button icon={<DeleteIcon/>}
                                                    className="labeled-button"
                                                    variant="link"
                                                    onClick={e => {
                                                        setShowDeleteConfirmation(true);
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
            <FlexItem>{env === "dev" && deleteButton(env)}</FlexItem>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </Flex>
    )
}
