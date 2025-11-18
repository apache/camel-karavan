/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useState} from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner, Switch, Tooltip, TooltipPosition} from '@patternfly/react-core';
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import StopIcon from "@patternfly/react-icons/dist/esm/icons/stop-icon";
import DeployIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import {useAppConfigStore, useDevModeStore, useLogStore, useProjectStore, useStatusesStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import RunIcon from "@patternfly/react-icons/dist/esm/icons/play-icon";
import {KaravanApi} from "@/api/KaravanApi";
import {EventBus} from "@/integration-designer/utils/EventBus";

interface Props {
    env: string,
}

export function ContainerButtons(props: Props) {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [status] = useDevModeStore((state) => [state.status], shallow)
    const [project] = useProjectStore((state) => [state.project], shallow)
    const [containers] = useStatusesStore((state) => [state.containers], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);

    const [pullImage, setPullImage] = useState<boolean>(false);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
    const [actionType, setActionType] = useState<'deploy' | 'run' | 'stop' | 'delete'>('run');

    const containerStatus = containers.filter(c => c.containerName === project.projectId).at(0);
    const commands = containerStatus?.commands || ['deploy'];
    const isRunning = containerStatus?.state === 'running';
    const inTransit = containerStatus?.inTransit;
    const isLoading = status === 'wip';

    function act() {
        KaravanApi.manageContainer(project.projectId, 'packaged', project.projectId, actionType, pullImage ? 'always' : 'never', res => {
            const response = res?.response;
            if (response?.status === 500) {
                EventBus.sendAlert('Error', response.data !== undefined && response.data.length > 0 ? response.data : response.statusText, 'warning')
            }
            setShowLog(false, 'container', undefined)
        });
    }

    function getConfirmationModal() {
        return (<Modal
            isOpen={showConfirmation}
            onClose={() => setShowConfirmation(false)}
            onEscapePress={e => setShowConfirmation(false)}>
            <ModalHeader title='Confirmation'/>
            <ModalBody>
                <div>{"Confirm " + actionType + " container?"}</div>
                {actionType === 'deploy' && <div>
                    <Switch
                        label="Pull image"
                        isChecked={pullImage}
                        onChange={(_, checked) => setPullImage(checked)}
                        isReversed
                    />
                </div>}
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary" onClick={e => {
                    if (actionType && project.projectId) {
                        act();
                        setShowConfirmation(false);
                    }
                }}>Confirm
                </Button>
                <Button key="cancel" variant="link"
                        onClick={e => setShowConfirmation(false)}>Cancel</Button>
            </ModalFooter>
        </Modal>)
    }

    return (
        <div style={{flex: '2', display: 'flex', flexDirection: 'row', justifyContent: 'end', alignItems: 'center', gap: '6px'}}>
            <div>
                {(inTransit || isLoading) && <Spinner size="lg" aria-label="spinner"/>}
            </div>
            <div>
                <Tooltip content="Deploy container" position={TooltipPosition.bottom}>
                    <Button className="dev-action-button"
                            isDisabled={(!(commands.length === 0) && !commands.includes('deploy')) || inTransit}
                            variant={"primary"}
                            icon={<DeployIcon/>}
                            onClick={() => {
                                setActionType('deploy');
                                setShowConfirmation(true);
                            }}>Deploy</Button>
                </Tooltip>
            </div>
            <div>
                <Tooltip content="Run container" position={TooltipPosition.bottom}>
                    <Button className="dev-action-button"
                            isDisabled={(!(commands.length === 0) && !commands.includes('run')) || inTransit}
                            variant={"primary"}
                            icon={<RunIcon/>}
                            onClick={() => {
                                setActionType('run');
                                setShowConfirmation(true);
                            }}>
                        Run
                    </Button>
                </Tooltip>
            </div>
            <div>
                <Tooltip content="Stop container" position={TooltipPosition.bottom}>
                    <Button className="dev-action-button"
                            isDisabled={!commands.includes('stop') || inTransit}
                            variant={"control"}
                            icon={<StopIcon/>}
                            onClick={() => {
                                setActionType('stop');
                                setShowConfirmation(true);
                            }}>
                        Stop
                    </Button>
                </Tooltip>
            </div>
            <div>
                <Tooltip content="Delete container" position={TooltipPosition.bottom}>
                    <Button className="dev-action-button"
                            isDisabled={!commands.includes('delete') || inTransit}
                            variant={"control"}
                            icon={<DeleteIcon/>}
                            onClick={() => {
                                setActionType('delete');
                                setShowConfirmation(true);
                            }}>
                        Delete
                    </Button>
                </Tooltip>
            </div>
            {showConfirmation && getConfirmationModal()}
        </div>);
}