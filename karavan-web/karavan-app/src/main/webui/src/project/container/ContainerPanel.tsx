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
    Badge,
    Button,
    Flex,
    FlexItem,
    Label,
    LabelGroup, Modal,
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

export function ContainerPanel (props: Props) {

    const {config} = useAppConfigStore();
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [setShowLog] = useLogStore((s) => [s.setShowLog], shallow);
    const [containers] = useStatusesStore((s) => [s.containers], shallow);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [deleteEntityName, setDeleteEntityName] = useState<string>();

    function deleteEntity() {
        if (deleteEntityName) {
            KaravanApi.stopBuild('dev', deleteEntityName, (res: any) => {
                if (res.status === 200) {
                    EventBus.sendAlert("Container deleted", "Container deleted: " + deleteEntityName, 'info');
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
            <div>{"Delete container " + deleteEntityName + "?"}</div>
        </Modal>)
    }

    function getBadge(cs: ContainerStatus) {
        return config.infrastructure === 'kubernetes'
            ? <Badge isRead>{cs.phase}</Badge>
            : <Badge isRead>{cs.state}</Badge>
    }

    const env = props.env;
    const conts = containers
        .filter(c => c.env == env)
        .filter(d => d.projectId === project?.projectId && d.type === 'project');
    return (
        <Flex justifyContent={{default: "justifyContentSpaceBetween"}}
              alignItems={{default: "alignItemsFlexStart"}}>
            <FlexItem>
                {conts.length === 0 && <Label icon={<DownIcon/>} color={"grey"}>No pods</Label>}
                <LabelGroup numLabels={10} isVertical>
                    {conts.map((cs: ContainerStatus) => {
                            const ready = cs.state === 'running';
                            return (
                                <Label icon={ready ? <UpIcon/> : <DownIcon/>} color={ready ? "green" : "grey"}>
                                    <Button variant="link" className="dev-action-button labeled-button"
                                            onClick={e => {
                                                setShowLog(true, 'container', cs.containerName);
                                            }}>
                                        {cs.containerName}
                                    </Button>
                                    {getBadge(cs)}
                                    <Button
                                        icon={<DeleteIcon/>}
                                        className="labeled-button"
                                        variant="link" onClick={e => {
                                        setShowDeleteConfirmation(true);
                                        setDeleteEntityName(cs.containerName);
                                    }}></Button>
                                </Label>
                            )
                        }
                    )}
                </LabelGroup>
            </FlexItem>
            <FlexItem>{env === "dev" && config.infrastructure !== 'kubernetes' && <ContainerButtons env={env}/>}</FlexItem>
            {showDeleteConfirmation && getDeleteConfirmation()}
        </Flex>
    )
}
