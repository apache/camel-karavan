import React, {useState} from 'react';
import {Button, Flex, FlexItem, Modal, Spinner, Tooltip, TooltipPosition} from '@patternfly/react-core';
import '../../designer/karavan.css';
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {useAppConfigStore, useDevModeStore, useLogStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import RunIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import {KaravanApi} from "../../api/KaravanApi";
import StopIcon from "@patternfly/react-icons/dist/js/icons/stop-icon";


interface Props {
    env: string,
}

export function ContainerButtons (props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [status] = useDevModeStore((state) => [state.status], shallow)
    const [project] = useProjectStore((state) => [state.project], shallow)
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);

    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [actionType, setActionType] = useState<'run' | 'stop' | 'delete'>('run');

    const containerStatus = containers.filter(c => c.containerName === project.projectId).at(0);
    const commands = containerStatus?.commands || ['run'];
    const isRunning = containerStatus?.state === 'running';
    const inTransit = containerStatus?.inTransit;
    const isLoading = status === 'wip';

    function act() {
        switch (actionType) {
            case "run":
                KaravanApi.manageContainer(props.env, 'project', project.projectId, 'run', res => {
                    setShowLog(false, 'container', undefined)
                });
                break;
            case "stop":
                KaravanApi.manageContainer(props.env, 'project', project.projectId, 'stop', res => {
                    setShowLog(false, 'container', undefined)
                });
                break;
            case "delete":
                KaravanApi.manageContainer(props.env, 'project', project.projectId, 'delete', res => {
                    setShowLog(false, 'container', undefined)
                });
                break;
        }
    }

    function getConfirmationModal() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (actionType && project.projectId) {
                        act();
                        setShowConfirmation(false);
                    }
                }}>Confirm
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowConfirmation(false)}>
            <div>{"Confirm " + actionType + " container?"}</div>
        </Modal>)
    }

    return (<Flex className="toolbar" direction={{default: "row"}} alignItems={{default: "alignItemsCenter"}}>
        <FlexItem>
            {(inTransit || isLoading) && <Spinner size="lg" aria-label="spinner"/>}
        </FlexItem>
        {!isRunning && config.infrastructure !== 'kubernetes' && <FlexItem>
            <Tooltip content="Run container" position={TooltipPosition.bottom}>
                <Button size="sm"
                        isDisabled={(!(commands.length === 0) && !commands.includes('run')) || inTransit}
                        variant={"primary"}
                        icon={<RunIcon/>}
                        onClick={() => {
                            setActionType('run');
                            setShowConfirmation(true);
                        }}>
                    {"Run"}
                </Button>
            </Tooltip>
        </FlexItem>}
        {config.infrastructure !== 'kubernetes' &&
            <FlexItem>
                <Tooltip content="Stop container" position={TooltipPosition.bottom}>
                    <Button size="sm"
                            isDisabled={!commands.includes('stop') || inTransit}
                            variant={"control"}
                            icon={<StopIcon/>}
                            onClick={() => {
                                setActionType('stop');
                                setShowConfirmation(true);
                            }}>
                    </Button>
                </Tooltip>
            </FlexItem>
        }
        <FlexItem>
            <Tooltip content="Delete container" position={TooltipPosition.bottom}>
                <Button size="sm"
                        isDisabled={!commands.includes('delete') || inTransit}
                        variant={"control"}
                        icon={<DeleteIcon/>}
                        onClick={() => {
                            setActionType('delete');
                            setShowConfirmation(true);
                        }}>
                </Button>
            </Tooltip>
        </FlexItem>
        {showConfirmation && getConfirmationModal()}
    </Flex>);
}