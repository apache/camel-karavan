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
    Tooltip,
    Flex,
    FlexItem,
    Modal,
    Panel,
    PanelHeader,
    TextContent,
    Text,
    TextVariants,
    Bullseye,
    EmptyState,
    EmptyStateVariant,
    EmptyStateHeader,
    EmptyStateIcon,
    PageSection,
    Switch,
    TextInput,
    Card,
    CardBody, CardHeader
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useFilesStore, useProjectStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {Table} from "@patternfly/react-table/deprecated";
import {Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import SetIcon from "@patternfly/react-icons/dist/esm/icons/check-icon";
import {KaravanApi} from "../../api/KaravanApi";
import {ProjectService} from "../../api/ProjectService";
import {ServicesYaml} from "../../api/ServiceModels";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-icon";
import {EventBus} from "../../designer/utils/EventBus";

export function ImagesPanel() {

    const [project, images] = useProjectStore((s) => [s.project, s.images], shallow);
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [showSetConfirmation, setShowSetConfirmation] = useState<boolean>(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState<boolean>(false);
    const [imageName, setImageName] = useState<string>();
    const [commitChanges, setCommitChanges] = useState<boolean>(false);
    const [commitMessage, setCommitMessage] = useState('');

    function setProjectImage() {
        if (imageName) {
            KaravanApi.setProjectImage(project.projectId, imageName, commitChanges, commitMessage, (res: any) => {
                ProjectService.refreshProjectData(project.projectId);
            });
        }
    }

    function getProjectImage(): string | undefined {
        const file = files.filter(f => f.name === 'docker-compose.yaml').at(0);
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
            className="modal-delete"
            title="Confirmation"
            isOpen={showSetConfirmation}
            onClose={() => setShowSetConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (imageName) {
                        setProjectImage();
                        setShowSetConfirmation(false);
                        setCommitChanges(false);
                    }
                }}>Set
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => {
                            setShowSetConfirmation(false);
                            setCommitChanges(false);
                        }}>Cancel</Button>
            ]}
            onEscapePress={e => setShowSetConfirmation(false)}>
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
        </Modal>)
    }

    function getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                    if (imageName) {
                        KaravanApi.deleteImage(imageName, () => {
                            EventBus.sendAlert("Image deleted", "Image " + imageName + " deleted", 'info');
                            setShowDeleteConfirmation(false);
                        });
                    }
                }}>Delete
                </Button>,
                <Button key="cancel" variant="link"
                        onClick={e => setShowDeleteConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowDeleteConfirmation(false)}>
            <div>{"Delete image:"}</div>
            <div>{imageName}</div>
        </Modal>)
    }

    const projectImage = getProjectImage();
    return (
        <PageSection className="project-tab-panel project-images-panel" padding={{default: "padding"}}>
            <Card>
                <CardHeader>
                    <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexStart"}}>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h6}>Images</Text>
                            </TextContent>
                        </FlexItem>
                    </Flex>
                </CardHeader>
                <CardBody className='table-card-body'>
                    <Table aria-label="Images" variant={"compact"} className={"table"}>
                        <Thead>
                            <Tr>
                                <Th key='status' width={10}></Th>
                                <Th key='image' width={20}>Image</Th>
                                <Th key='tag' width={10}>Tag</Th>
                                <Th key='actions' width={10}></Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                            {images.map(image => {
                                const index = image.lastIndexOf(":");
                                const name = image.substring(0, index);
                                const tag = image.substring(index + 1);
                                return <Tr key={image}>
                                    <Td modifier={"fitContent"}>
                                        {image === projectImage ? <SetIcon/> : <div/>}
                                    </Td>
                                    <Td>
                                        {name}
                                    </Td>
                                    <Td>
                                        {tag}
                                    </Td>
                                    <Td modifier={"fitContent"} isActionCell>
                                        <Flex direction={{default: "row"}}
                                              justifyContent={{default: "justifyContentFlexEnd"}}
                                              spaceItems={{default: 'spaceItemsNone'}}>
                                            <FlexItem>
                                                <Tooltip content={"Delete image"} position={"bottom"}>
                                                    <Button variant={"plain"}
                                                            className='dev-action-button'
                                                            icon={<DeleteIcon/>}
                                                            isDisabled={image === projectImage}
                                                            onClick={e => {
                                                                setImageName(image);
                                                                setShowDeleteConfirmation(true);
                                                            }}>
                                                    </Button>
                                                </Tooltip>
                                            </FlexItem>
                                            <FlexItem>
                                                <Tooltip content="Set project image" position={"bottom"}>
                                                    <Button style={{padding: '0'}}
                                                            variant={"plain"}
                                                            className='dev-action-button'
                                                            isDisabled={image === projectImage}
                                                            onClick={e => {
                                                                setImageName(image);
                                                                setCommitMessage(commitMessage === '' ? new Date().toLocaleString() : commitMessage);
                                                                setShowSetConfirmation(true);
                                                            }}>
                                                        <SetIcon/>
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
                                            <EmptyState variant={EmptyStateVariant.sm}>
                                                <EmptyStateHeader titleText="No results found"
                                                                  icon={<EmptyStateIcon icon={SearchIcon}/>}
                                                                  headingLevel="h2"/>
                                            </EmptyState>
                                        </Bullseye>
                                    </Td>
                                </Tr>
                            }
                        </Tbody>
                    </Table>
                    {showSetConfirmation && getSetConfirmation()}
                    {showDeleteConfirmation && getDeleteConfirmation()}
                </CardBody>
            </Card>
        </PageSection>
    )
}
