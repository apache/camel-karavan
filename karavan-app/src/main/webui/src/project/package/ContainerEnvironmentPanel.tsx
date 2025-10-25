/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http:www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useState} from 'react';
import {Button, ClipboardCopy, Flex, FlexItem, Label} from '@patternfly/react-core';

import '../../designer/karavan.css';
import DownIcon from "@patternfly/react-icons/dist/esm/icons/error-circle-o-icon";
import {useAppConfigStore, useLogStore, useProjectStore, useStatusesStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerStatus} from "@/api/ProjectModels";
import DeleteIcon from "@patternfly/react-icons/dist/esm/icons/times-circle-icon";
import ImageIcon from "@patternfly/react-icons/dist/esm/icons/cube-icon";
import {KaravanApi} from "@/api/KaravanApi";
import {EventBus} from "@/designer/utils/EventBus";
import {ContainerButton} from "@/components/ContainerButton";
import {ModalConfirmation} from "@/components/ModalConfirmation";

interface Props {
    env: string,
}

export function ContainerEnvironmentPanel(props: Props) {

    const {config} = useAppConfigStore();
    const [project] = useProjectStore((s) => [s.project], shallow);
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

    function getStatusBadge(cs: ContainerStatus) {
        return isKubernetes ? cs.phase : cs.state
    }

    const env = props.env;
    const conts = containers
        .filter(c => c.env === env)
        .filter(d => d.projectId === project?.projectId && d.type === 'packaged');

    const isKubernetes = config.infrastructure === 'kubernetes';
    const noContainersText = isKubernetes ? 'No pods' : 'No containers';

    return (
        <Flex justifyContent={{default: "justifyContentSpaceBetween"}}
              alignItems={{default: "alignItemsFlexStart"}}>
            <FlexItem>
                {conts.length === 0 && <Label icon={<DownIcon/>} color={"grey"}>{noContainersText}</Label>}
                <Flex direction={{default: 'column'}}>
                    {conts.map((cs: ContainerStatus, index) => {
                            const ready = cs.state === 'running';
                            return (
                                <div style={{display: 'flex', gap: '8px'}} key={index}>
                                    <ContainerButton container={cs}/>
                                    <Label icon={<ImageIcon/>} color={ready ? "green" : "grey"} variant='outline'>
                                        Image:
                                        <ClipboardCopy hoverTip="Copy" clickTip="Copied" variant="inline-compact" style={{backgroundColor: 'transparent'}}>
                                            {cs.image}
                                        </ClipboardCopy>
                                    </Label>
                                    {isKubernetes && <Button
                                        isDanger
                                        icon={<DeleteIcon/>}
                                        className="karavan-labeled-button"
                                        variant="link" onClick={e => {
                                        setShowDeleteConfirmation(true);
                                        setDeleteEntityName(cs.containerName);
                                    }}></Button>}
                                </div>
                            )
                        }
                    )}
                </Flex>
            </FlexItem>
            {showDeleteConfirmation &&
                <ModalConfirmation
                    isOpen={showDeleteConfirmation}
                    message={"Delete container " + deleteEntityName + "?"}
                    btnConfirm='Delete'
                    btnConfirmVariant='danger'
                    onConfirm={() => {
                        if (deleteEntityName) {
                            deleteEntity();
                            setShowDeleteConfirmation(false);
                        }
                    }}
                    onCancel={() => setShowDeleteConfirmation(false)}
                />
            }
        </Flex>
    )
}
