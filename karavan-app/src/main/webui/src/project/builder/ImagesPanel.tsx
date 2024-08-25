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
    CardBody, CardHeader, HelperTextItem, HelperText
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useAppConfigStore, useFilesStore, useProjectStore} from "../../api/ProjectStore";
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
import {getMegabytes} from "../../util/StringUtils";
import PullIcon from "@patternfly/react-icons/dist/esm/icons/cloud-download-alt-icon";

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
            title="Confirmation"
            variant='medium'
            isOpen={showDeleteConfirmation}
            onClose={() => setShowDeleteConfirmation(false)}
            actions={[
                <Button key="confirm" variant="danger" onClick={e => {
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
            <TextContent>
                <Text component='p'>
                    {"Delete image: "}<b>{imageName}</b>
                </Text>
                <HelperText>
                    <HelperTextItem variant="warning" hasIcon>
                        Container Image will be deleted from Docker Engine only!
                    </HelperTextItem>
                </HelperText>
            </TextContent>
        </Modal>)
    }

    function getPullConfirmation() {
        return (<Modal
            title="Confirmation"
            variant='medium'
            isOpen={showPullConfirmation}
            onClose={() => setShowPullConfirmation(false)}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => {
                        KaravanApi.pullProjectImages(project.projectId, () => {
                            setShowPullConfirmation(false);
                        });
                }}>Pull
                </Button>,
                <Button key="cancel" variant="link" onClick={_ => setShowPullConfirmation(false)}>Cancel</Button>
            ]}
            onEscapePress={e => setShowPullConfirmation(false)}>
            <TextContent>
                <Text component='p'>
                    {"Pull all images from Registry for project: "}<b>{project.projectId}</b>
                </Text>
                <HelperText>
                    <HelperTextItem variant="warning" hasIcon>
                        Pull is a background process that might take some time!
                    </HelperTextItem>
                </HelperText>
            </TextContent>
        </Modal>)
    }

    const projectImage = getProjectImage();
    return (
        <PageSection className="project-tab-panel project-images-panel" padding={{default: "padding"}}>
            <Card>
                <CardHeader>
                    <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentSpaceBetween"}}>
                        <FlexItem>
                            <TextContent>
                                <Text component={TextVariants.h6}>Images</Text>
                            </TextContent>
                        </FlexItem>
                        <FlexItem>
                            <Tooltip content="Pull all images from registry" position={"bottom-end"}>
                                <Button variant={"secondary"} className="dev-action-button" icon={<PullIcon/>}
                                        onClick={() => setShowPullConfirmation(true)}>
                                    Pull
                                </Button>
                            </Tooltip>
                        </FlexItem>
                    </Flex>
                </CardHeader>
                <CardBody className='table-card-body'>
                    <Table aria-label="Images" variant={"compact"} className={"table"}>
                        <Thead>
                            <Tr>
                                <Th key='status' modifier={"fitContent"}>Status</Th>
                                <Th key='image' width={20}>Image</Th>
                                <Th key='tag' width={10}>Tag</Th>
                                <Th key='size' width={10}>Size</Th>
                                <Th key='created' width={10}>Created</Th>
                                <Th key='actions' width={20}></Th>
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
                                return <Tr key={image.id}>
                                    <Td modifier={"fitContent"}>
                                        {fullName === projectImage ? <SetIcon/> : <div/>}
                                    </Td>
                                    <Td>{name}</Td>
                                    <Td>{tag}</Td>
                                    <Td>{size} MB</Td>
                                    <Td>{created.toISOString()}</Td>
                                    <Td modifier={"fitContent"} isActionCell>
                                        <Flex direction={{default: "row"}}
                                              flexWrap={{default:'nowrap'}}
                                              justifyContent={{default: "justifyContentFlexEnd"}}
                                              spaceItems={{default: 'spaceItemsNone'}}>
                                            <FlexItem>
                                                <Tooltip content={"Delete image"} position={"bottom"}>
                                                    <Button variant={"link"}
                                                            className='dev-action-button'
                                                            icon={<DeleteIcon/>}
                                                            isDisabled={fullName === projectImage || !isDev}
                                                            onClick={e => {
                                                                setImageName(fullName);
                                                                setShowDeleteConfirmation(true);
                                                            }}>
                                                    </Button>
                                                </Tooltip>
                                            </FlexItem>
                                            <FlexItem>
                                                <Tooltip content="Set project image" position={"bottom"}>
                                                    <Button variant={"link"}
                                                            className='dev-action-button'
                                                            isDisabled={fullName === projectImage || !isDev}
                                                            onClick={e => {
                                                                setImageName(fullName);
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
                    {showPullConfirmation && getPullConfirmation()}
                </CardBody>
            </Card>
        </PageSection>
    )
}
