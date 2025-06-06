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
import {Button, Card, CardBody, Flex, FlexItem, Label, LabelGroup, Modal, Spinner, Text, TextContent, Tooltip} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {KaravanApi} from "../../api/KaravanApi";
import BuildIcon from "@patternfly/react-icons/dist/esm/icons/build-icon";
import UpIcon from "@patternfly/react-icons/dist/esm/icons/check-circle-icon";
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import ClockIcon from "@patternfly/react-icons/dist/esm/icons/clock-icon";
import TagIcon from "@patternfly/react-icons/dist/esm/icons/tag-icon";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import {useLogStore, useProjectStore, useStatusesStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {EventBus} from "../../designer/utils/EventBus";

export function BuildPanel() {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [containers, deployments, camels] =
        useStatusesStore((s) => [s.containers, s.deployments, s.camels], shallow);
    const [isPushing, setIsPushing] = useState<boolean>(false);
    const [isBuilding, setIsBuilding] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityName, setDeleteEntityName] = useState<string>();
    const [tag, setTag] = useState<string>('latest');

    function deleteEntity() {
        const buildName = getBuildName();
        if (buildName) {
            KaravanApi.manageContainer(project.projectId, 'build', buildName, 'delete', 'never', res => {
                EventBus.sendAlert("Container deleted", "Container " + buildName + " deleted", 'info')
                setShowLog(false, 'container', undefined)
            });
        }
    }

    function build() {
        setIsBuilding(true);
        setShowLog(false, 'none')
        KaravanApi.buildProject(project, tag, res => {
            if (res.status === 200 || res.status === 201) {
                setIsBuilding(false);
            } else {
                console.log(res);
                EventBus.sendAlert("Error", (res as any)?.response?.data, 'danger')
            }
        });
    }

    function buildButton() {
        const status = containers.filter(c => c.projectId === project.projectId && c.type === 'build').at(0);
        const isRunning = status?.state === 'running';
        return (
            <Tooltip content={"Build project"} position={"left"}>
                <Button isLoading={isBuilding ? true : undefined}
                        isDisabled={isBuilding || isRunning || isPushing}
                        size="sm"
                        variant="primary"
                        className="project-button dev-action-button"
                        icon={!isBuilding ? <BuildIcon/> : <div></div>}
                        onClick={e => build()}>
                    {isBuilding ? "..." : "Build"}
                </Button>
            </Tooltip>
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
        const isExited = state === 'exited';
        const isFailed = state === 'failed';
        const color = (isRunning ? "blue" : (isFailed ? "red" : "grey"));
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
                                    isDanger
                                    icon={<DeleteIcon/>}
                                    className="labeled-button dev-action-button"
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

    function getTitle(title: string, width: string = 'auto') {
        return (
            <TextContent style={{width: width}}>
                <Text component='h4'>{title}</Text>
            </TextContent>
        )
    }

    return (
        <Card className="project-status">
            <CardBody>
                <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', gap: '16px'}}>
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '16px', width: '200px'}}>
                        {getTitle("Build with tag", '90px')}
                        {getBuildTag()}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'start', alignItems: 'center', gap: '16px'}}>
                        {getTitle("Status")}
                        {getBuildState()}
                    </div>
                    <div style={{flex: '2', display: 'flex', flexDirection: 'row', justifyContent: 'end', alignItems: 'center'}}>
                        {buildButton()}
                    </div>
                </div>
            </CardBody>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </Card>
    )
}
