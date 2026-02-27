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
    Bullseye,
    Button,
    Content,
    Divider,
    EmptyState,
    EmptyStateVariant,
    Flex,
    FlexItem,
    HelperText,
    HelperTextItem,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Switch,
    TextInput,
    Tooltip
} from '@patternfly/react-core';

import {useAppConfigStore, useFilesStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {CheckIcon, CloudDownloadAltIcon, SearchIcon, TimesIcon} from '@patternfly/react-icons';
import {KaravanApi} from "@api/KaravanApi";
import {ProjectService} from "@services/ProjectService";
import {ServicesYaml} from "@models/ServiceModels";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {getMegabytes} from "@util/StringUtils";
import {DOCKER_COMPOSE} from "@models/ProjectModels";

export function ImagesPanel() {

    const [project, images] = useProjectStore((s) => [s.project, s.images], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [showSetConfirmation, setShowSetConfirmation] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [showPullConfirmation, setShowPullConfirmation] = useState<boolean>(false);
    const [imageName, setImageName] = useState<string>();
    const [commitChanges, setCommitChanges] = useState<boolean>(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    function setProjectImage() {
        if (imageName) {
            KaravanApi.setProjectImage(project.projectId, imageName, commitChanges, commitMessage, (res: any) => {
                ProjectService.refreshProjectData(project.projectId);
            });
        }
    }

    function getProjectImage(): string | undefined {
        const file = files.filter(f => f.name === DOCKER_COMPOSE).at(0);
        if (file) {
            const dc = ServicesYaml.yamlToServices(file.code);
            const dcs = dc.services.filter(s => s.container_name === project.projectId).at(0);
            return dcs?.image;
        }
        return undefined;
    }

    function getSetConfirmation() {
        const index = imageName?.lastIndexOf(":");
        const name = imageName?.substring(0, index);
        const tag = index ? imageName?.substring(index + 1) : "";
        return (<Modal
            variant='small'
            isOpen={showSetConfirmation}
            onClose={() => setShowSetConfirmation(false)}
            onEscapePress={(e: any) => setShowSetConfirmation(false)}>
            <ModalHeader title="Confirmation"/>
            <ModalBody>
                <Flex direction={{default: "column"}} justifyContent={{default: "justifyContentFlexStart"}}>
                    <FlexItem>
                        <div>{"Set image for project " + project.projectId + ":"}</div>
                        <div>{"Name: " + name}</div>
                        <div>{"Tag: " + tag}</div>
                    </FlexItem>
                    <FlexItem>
                        <Switch
                            id="commit-switch"
                            label="Commit changes"
                            isChecked={commitChanges}
                            onChange={(event, checked) => setCommitChanges(checked)}
                            isReversed
                        />
                    </FlexItem>
                    {commitChanges && <FlexItem>
                        <TextInput value={commitMessage} type="text"
                                   onChange={(_, value) => setCommitMessage(value)}
                                   aria-label="commit message"/>
                    </FlexItem>}
                </Flex>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary" onClick={e => {
                    if (imageName) {
                        setProjectImage();
                        setShowSetConfirmation(false);
                        setCommitChanges(false);
                    }
                }}>Set
                </Button>
                <Button key="cancel" variant="link"
                        onClick={e => {
                            setShowSetConfirmation(false);
                            setCommitChanges(false);
                        }}>Cancel</Button>
            </ModalFooter>
        </Modal>)
    }

    function getDeleteConfirmation() {
        return (<Modal
            variant='small'
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <ModalHeader title="Confirmation"/>
            <ModalBody>
                <Content>
                    <Content component='p'>
                        {"Delete image: "}<b>{imageName}</b>
                    </Content>
                    <HelperText>
                        <HelperTextItem variant="warning">
                            Container Image will be deleted from Docker Engine only!
                        </HelperTextItem>
                    </HelperText>
                </Content>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="danger" onClick={e => {
                    if (imageName) {
                        KaravanApi.deleteImage(imageName, () => {
                            EventBus.sendAlert("Image deleted", "Image " + imageName + " deleted", 'info');
                            setShowDeleteConfirmation(false);
                        });
                    }
                }}>Delete
                </Button>
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            </ModalFooter>
        </Modal>)
    }

    function getPullConfirmation() {
        return (<Modal
            variant='small'
            isOpen={showPullConfirmation}
            onClose={() => setShowPullConfirmation(false)}
            onEscapePress={e => setShowPullConfirmation(false)}>
            <ModalHeader title="Confirmation"/>
            <ModalBody>
                <Content>
                    <Content component='p'>
                        {"Pull all images from Registry for project: "}<b>{project.projectId}</b>
                    </Content>
                    <HelperText>
                        <HelperTextItem variant="warning">
                            Pull is a background process that might take some time!
                        </HelperTextItem>
                    </HelperText>
                </Content>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary" onClick={e => {
                    KaravanApi.pullProjectImages(project.projectId, () => {
                        setShowPullConfirmation(false);
                    });
                }}>Pull
                </Button>
                <Button key="cancel" variant="link" onClick={_ => setShowPullConfirmation(false)}>Cancel</Button>
            </ModalFooter>
        </Modal>)
    }

    const projectImage = getProjectImage();
    return (
        <>
            <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: "16px"}}>
                <Content component='h6' style={{padding: '16px'}}>Images</Content>
                <Tooltip content="Pull all images from registry" position={"bottom-end"}>
                    <Button variant={"secondary"} className="dev-action-button" icon={<CloudDownloadAltIcon/>}
                            onClick={() => setShowPullConfirmation(true)}>
                        Pull
                    </Button>
                </Tooltip>
            </div>
            <Divider/>
            <Table aria-label="Images" variant={"compact"} isStickyHeader>
                <Thead>
                    <Tr>
                        <Th key='status' modifier={"fitContent"}>Active</Th>
                        <Th key='image' width={20}>Image</Th>
                        <Th key='tag' width={10}>Tag</Th>
                        <Th key='size' width={10}>Size</Th>
                        <Th key='created' width={10}>Created</Th>
                        <Th key='actions' aria-label='actions' modifier={"fitContent"} textCenter>Actions</Th>
                    </Tr>
                </Thead>
                <Tbody>
                    {images.map(image => {
                        const fullName = image.tag;
                        const index = fullName.lastIndexOf(":");
                        const name = fullName.substring(0, index);
                        const tag = fullName.substring(index + 1);
                        const created = new Date(image.created * 1000);
                        const size = getMegabytes(image.size)?.toFixed(0);
                        const isDisabled = fullName === projectImage || !isDev;
                        const variant = isDisabled ? "plain" : "link";
                        return <Tr key={image.id} style={{verticalAlign: "middle"}}>
                            <Td modifier={"fitContent"}>
                                {fullName === projectImage ? <CheckIcon/> : <div/>}
                            </Td>
                            <Td>{name}</Td>
                            <Td>{tag}</Td>
                            <Td>{size} MB</Td>
                            <Td>{created.toISOString()}</Td>
                            <Td modifier={"fitContent"} isActionCell>
                                <Flex direction={{default: "row"}}
                                      flexWrap={{default: 'nowrap'}}
                                      justifyContent={{default: "justifyContentFlexEnd"}}
                                      spaceItems={{default: 'spaceItemsNone'}}>
                                    <FlexItem>
                                        <Tooltip content={"Delete image"} position={"bottom"}>
                                            <Button variant={variant}
                                                    className='dev-action-button'
                                                    icon={<TimesIcon/>}
                                                    isDisabled={isDisabled}
                                                    onClick={e => {
                                                        setImageName(fullName);
                                                        setShowDeleteConfirmation(true);
                                                    }}>
                                            </Button>
                                        </Tooltip>
                                    </FlexItem>
                                    <FlexItem>
                                        <Tooltip content="Set project image" position={"bottom"}>
                                            <Button icon={<CheckIcon/>} variant={variant}
                                                    className='dev-action-button'
                                                    isDisabled={isDisabled}
                                                    onClick={e => {
                                                        setImageName(fullName);
                                                        setCommitMessage(commitMessage === '' ? new Date().toLocaleString() : commitMessage);
                                                        setShowSetConfirmation(true);
                                                    }}>

                                            </Button>
                                        </Tooltip>
                                    </FlexItem>
                                </Flex>
                            </Td>
                        </Tr>
                    })}
                    {images.length === 0 &&
                        <Tr>
                            <Td colSpan={8}>
                                <Bullseye>
                                    <EmptyState headingLevel="h2" icon={SearchIcon} titleText="No results found" variant={EmptyStateVariant.sm}>
                                    </EmptyState>
                                </Bullseye>
                            </Td>
                        </Tr>
                    }
                </Tbody>
            </Table>
            {showSetConfirmation && getSetConfirmation()}
            {showDeleteConfirmation && getDeleteConfirmation()}
            {showPullConfirmation && getPullConfirmation()}
        </>
    )
}
