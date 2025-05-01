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
import {
    Button,
    Flex,
    FlexItem,
     Modal,

} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import RolloutIcon from "@patternfly/react-icons/dist/esm/icons/process-automation-icon";
import DeployIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/trash-icon";
import {KaravanApi} from "../../api/KaravanApi";
import {EventBus} from "../../designer/utils/EventBus";

interface Props {
    env: string,
}

export function DeploymentButtons (props: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [deployments] = useStatusesStore((s) => [s.deployments], shallow);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [showDeployConfirmation, setShowDeployConfirmation] = useState<boolean>(false);
    const [showRolloutConfirmation, setShowRolloutConfirmation] = useState<boolean>(false);

    function deleteDeployment() {
        if (project.projectId) {
            KaravanApi.deleteDeployment(props.env, project.projectId, (res: any) => {
                if (res.status === 200) {
                    EventBus.sendAlert("Deployment deleted", "Deployment deleted: " + project.projectId, 'info');
                }
            });
        }
    }

    function rolloutDeployment () {
        KaravanApi.rolloutDeployment(project.projectId, props.env, res => {
            if (res.status === 200) {
                EventBus.sendAlert("Rolled out", "Rolled out: " + project.projectId, 'info');
            }
        });
    }

    function startDeployment(){
        KaravanApi.startDeployment(project.projectId, props.env, res => {
            if (res.status === 200) {
                EventBus.sendAlert("Started", "Deployment started for " + project.projectId, 'info');
            } else {
                EventBus.sendAlert("Error", res.data, 'danger');
            }
        });
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (project.projectId) {
                        deleteDeployment();
                        setShowDeleteConfirmation(false);
                    }
                }}>Delete
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>{"Delete deployment " + project.projectId + "?"}</div>
        </Modal>)
    }

    function getRolloutConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showRolloutConfirmation}
            onClose={() => setShowRolloutConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (project.projectId) {
                        rolloutDeployment();
                        setShowRolloutConfirmation(false);
                    }
                }}>Rollout
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowRolloutConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowRolloutConfirmation(false)}>
            <div>{"Rollout deployment " + project.projectId + "?"}</div>
        </Modal>)
    }

    function getDeployConfirmation() {
            return (<Modal
                className="modal-delete"
                title="Confirmation"
                isOpen={showDeployConfirmation}
                onClose={() => setShowDeployConfirmation(false)}
                actions={[
                    <Button key="confirm" variant="primary" onClick={e => {
                        if (project.projectId) {
                            startDeployment();
                            setShowDeployConfirmation(false);
                        }
                    }}>Deploy
                    </Button>,
                    <Button key="cancel" variant="link"
                            onClick={e => setShowDeployConfirmation(false)}>Cancel</Button>
                ]}
                onEscapePress={e => setShowDeleteConfirmation(false)}>
                <div>{"Deploy " + project.projectId + "?"}</div>
            </Modal>)
        }

    function rolloutButton() {
        return (
            <Button size="sm" variant="secondary"
                    className="project-button dev-action-button"
                    icon={<RolloutIcon/>}
                    onClick={e => {
                        setShowRolloutConfirmation(true);
                    }}>
                Rollout
            </Button>)
    }

    function deployButton() {
        return (
            <Button size="sm" variant="primary"
                    className="project-button dev-action-button"
                    icon={<DeployIcon/>}
                    onClick={e => {
                        setShowDeployConfirmation(true);
                    }}>
                Deploy
            </Button>
        )
    }
    function deleteButton() {
        return (
            <Button size="sm" variant="control"
                    isDanger
                    className="project-button dev-action-button"
                    icon={<DeleteIcon/>}
                    onClick={e => {
                        setShowDeleteConfirmation(true);
                    }}>
                Delete
            </Button>
        )
    }

    const deploymentStatus = deployments.find(d => d.projectId === project?.projectId);

    return (
        <div className="toolbar">
            {deploymentStatus !== undefined && <div>{rolloutButton()}</div>}
            {deploymentStatus === undefined && <div>{deployButton()}</div>}
            {deploymentStatus !== undefined && <div>{deleteButton()}</div>}
            {showDeleteConfirmation && getDeleteConfirmation()}
            {showRolloutConfirmation && getRolloutConfirmation()}
            {showDeployConfirmation && getDeployConfirmation()}
        </div>
    )
}
