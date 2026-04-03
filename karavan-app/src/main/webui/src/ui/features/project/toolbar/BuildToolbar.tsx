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
import {Button, Content, Label, Modal, ModalBody, ModalFooter, ModalHeader, Tooltip} from '@patternfly/react-core';
import {KaravanApi} from "@api/KaravanApi";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import TagIcon from "@patternfly/react-icons/dist/esm/icons/tag-icon";
import {useProjectStore} from "@stores/ProjectStore";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {ContainerButton} from "@shared/ui/ContainerButton";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";

export function BuildToolbar() {

    const [project] = useProjectStore((s) => [s.project]);
    const {containers} = useContainerStatusesStore();
    const [isBuilding, setIsBuilding] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityName, setDeleteEntityName] = useState<string>();
    const [tag, setTag] = useState<string>('latest');

    function deleteEntity() {
        const buildName = getBuildName();
        if (buildName) {
            KaravanApi.manageContainer(project.projectId, 'build', buildName, 'delete', 'never', res => {
                EventBus.sendAlert("Container deleted", "Container " + buildName + " deleted", 'info')
            });
        }
    }

    function build() {
        setIsBuilding(true);
        KaravanApi.buildProject(project, tag, res => {
            if (res.status === 200 || res.status === 201) {
                setIsBuilding(false);
            } else {
                console.error(res);
                EventBus.sendAlert("Error", (res as any)?.response?.data, 'danger')
            }
        });
    }

    function buildButton() {
        const status = containers.filter(c => c.projectId === project.projectId && c.type === 'build').at(0);
        const isRunning = status?.state === 'running';
        const buildName = getBuildName();
        return (
            <div style={{display: 'flex', gap: '8px'}}>
                {status !== undefined && <Tooltip content={"Delete build container"}>
                    <Button
                        isDanger
                        // icon={<DeleteIcon/>}
                        className="dev-action-button"
                        variant="danger" onClick={e => {
                        setShowDeleteConfirmation(true);
                        setDeleteEntityName(buildName);
                    }}>Delete</Button>
                </Tooltip>}
                <Tooltip content={"Build project"} position={"bottom"}>
                    <Button isLoading={isBuilding ? true : undefined}
                            isDisabled={isBuilding || isRunning}
                            variant="primary"
                            className="project-button dev-action-button"
                            icon={!isBuilding ? <BuildIcon/> : <div></div>}
                            onClick={e => build()}>
                        {isBuilding ? "..." : "Build"}
                    </Button>
                </Tooltip>
            </div>
        )
    }

    function getContainerStatus() {
        return containers.filter(c => c.projectId === project.projectId && c.type === 'build').at(0);
    }

    function getBuildName() {
        const status = getContainerStatus();
        return status?.containerName;
    }

    function getBuildState() {
        const status = getContainerStatus();
        const buildName = getBuildName();
        const state = status?.state;
        let buildTime = 0;
        if (status?.created) {
            const start: Date = new Date(status.created);
            const finish: Date = status.finished !== undefined && status.finished !== null ? new Date(status.finished) : new Date();
            buildTime = Math.round((finish.getTime() - start.getTime()) / 1000);
        }
        const showTime = buildTime && buildTime > 0;
        const isRunning = state === 'running';
        const isFailed = state === 'failed';
        const color = (isRunning ? "blue" : (isFailed ? "red" : "grey"));
        return (
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px'}}>
                {status && <ContainerButton container={status}/>}
                {buildName !== undefined && showTime === true && buildTime !== undefined &&
                    <Label icon={<ClockIcon className="not-spinner"/>}
                           color={color}>{buildTime + "s"}</Label>}
            </div>
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
                   color={color}>
                {tag}
            </Label>
        )
    }

    function getDeleteConfirmation() {
        return (<Modal
            variant='small'
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <ModalHeader>
                <Content component='h2'>Confirmation</Content>
            </ModalHeader>
            <ModalBody>
                <div>{"Delete build " + deleteEntityName + "?"}</div>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="danger" onClick={e => {
                    if (deleteEntityName && deleteEntity) {
                        deleteEntity();
                        setShowDeleteConfirmation(false);
                    }
                }}>Delete
                </Button>
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            </ModalFooter>
        </Modal>)
    }

    function getTitle(title: string, width: string = 'auto') {
        return (
            <Content style={{width: width, margin: 0, color: 'var(--pf-t--global--dark--text--color--200)'}} component='h4'>{title}</Content>
        )
    }

    return (
        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '16px'}}>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: '16px', alignItems: 'center'}}>
                {getTitle("Build with tag")}
                {getBuildTag()}
            </div>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: '16px', alignItems: 'center'}}>
                {/*{getTitle("Status")}*/}
                {/*{getBuildState()}*/}
            </div>
            <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'end', flexGrow: 2, alignItems: 'center'}}>
                {buildButton()}
            </div>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </div>
    )
}
