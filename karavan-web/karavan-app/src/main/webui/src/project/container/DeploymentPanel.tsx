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
    Label,
    LabelGroup, Modal,
    Tooltip,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UpIcon from "@patternfly/react-icons/dist/esm/icons/running-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {useAppConfigStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import RolloutIcon from "@patternfly/react-icons/dist/esm/icons/process-automation-icon";
import {KaravanApi} from "../../api/KaravanApi";
import {EventBus} from "../../designer/utils/EventBus";

interface Props {
    env: string,
}

export function DeploymentPanel (props: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [ deployments] =
        useStatusesStore((s) => [s.deployments], shallow);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
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
            console.log(res)
            if (res.status === 200) {
                EventBus.sendAlert("Rolled out", "Rolled out: " + project.projectId, 'info');
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
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>{"Rollout deployment " + project.projectId + "?"}</div>
        </Modal>)
    }

    function rolloutButton() {
        return (<Tooltip content="Rollout deployment" position={"left"}>
            <Button size="sm" variant="secondary"
                    className="project-button dev-action-button"
                    icon={<RolloutIcon/>}
                    onClick={e => {
                        setShowRolloutConfirmation(true);
                    }}>
                {"Rollout"}
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
                    <Button
                        icon={<DeleteIcon/>}
                        className="labeled-button"
                        variant="link" onClick={e => {
                        setShowDeleteConfirmation(true);
                    }}></Button>
                </LabelGroup>}
                {deploymentStatus === undefined && <Label icon={<DownIcon/>} color={"grey"}>No deployments</Label>}
            </FlexItem>
            <FlexItem>{props.env === "dev" && rolloutButton()}</FlexItem>
            {showDeleteConfirmation && getDeleteConfirmation()}
            {showRolloutConfirmation && getRolloutConfirmation()}
        </Flex>
    )
}
