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
import React, {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    Flex,
    FlexItem,
    Form,
    FormGroup,
    FormHelperText,
    Label,
    Modal,
    ModalVariant,
    TextInput,
    Tooltip,
    TooltipPosition,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../../api/ProjectService";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import UpdateIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {ProjectType} from "../../api/ProjectModels";
import {KaravanApi} from "../../api/KaravanApi";
import {DslPosition, EventBus} from "../../designer/utils/EventBus";
import {KaravanEvent, NotificationEventBus} from "../../api/NotificationService";

export function FileToolbar () {

    const {config} = useAppConfigStore();
    const [commitMessageIsOpen, setCommitMessageIsOpen] = useState(false);
    const [pullIsOpen, setPullIsOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [project, isPushing, isPulling] =
        useProjectStore((s) => [s.project, s.isPushing, s.isPulling], shallow )
    const {files} = useFilesStore();
    const [file, editAdvancedProperties, setEditAdvancedProperties, setAddProperty, setFile] = useFileStore((s) =>
        [s.file, s.editAdvancedProperties, s.setEditAdvancedProperties, s.setAddProperty, s.setFile], shallow )

    // useEffect(() => {
    //     const sub1 = NotificationEventBus.onEvent()?.subscribe((evt: KaravanEvent) => {
    //         console.log(evt);
    //         setIsPushing(false);
    //     });
    //     return () => {
    //         sub1?.unsubscribe();
    //     };
    // });

    useEffect(() => {
    }, [project, file]);

    function push () {
        setCommitMessageIsOpen(false);
        useProjectStore.setState({isPushing: true});
        ProjectService.pushProject(project, commitMessage);
    }

    function updateScripts () {
        KaravanApi.updateBuildConfigMap(res => {
            EventBus.sendAlert("Success", "Script updated!", "info")
        })
    }

    function pull () {
        setPullIsOpen(false);
        ProjectService.pullProject(project.projectId);
    }

    function canAddFiles(): boolean {
        return !['templates', 'services'].includes(project.projectId);
    }

    function isTemplates(): boolean {
        return project.projectId === 'templates' && project.type === ProjectType.templates;
    }

    function getCommitModal() {
        return (
            <Modal
                title="Commit and push"
                variant={ModalVariant.small}
                isOpen={commitMessageIsOpen}
                onClose={() => setCommitMessageIsOpen(false)}
                actions={[
                    <Button key="confirm" variant="primary" onClick={() => push()}>Commit and push</Button>,
                    <Button key="cancel" variant="secondary" onClick={() => setCommitMessageIsOpen(false)}>Cancel</Button>
                ]}
            >
                <Form autoComplete="off" isHorizontal className="create-file-form">
                    <FormGroup label="Message" fieldId="name" isRequired>
                        <TextInput value={commitMessage} onChange={(_, value) => setCommitMessage(value)}/>
                        <FormHelperText  />
                    </FormGroup>
                </Form>
            </Modal>
        )
    }

    function getPullModal() {
        return (
            <Modal
                title="Pull"
                titleIconVariant={"danger"}
                variant={ModalVariant.small}
                isOpen={pullIsOpen}
                onClose={() => setPullIsOpen(false)}
                actions={[
                    <Button key="confirm" variant="danger" isDanger onClick={() => pull()}>Pull</Button>,
                    <Button key="cancel" variant="primary" onClick={() => setPullIsOpen(false)}>Cancel</Button>
                ]}
            >
                <div>
                    <Alert customIcon={<PushIcon />}
                           isInline
                           variant="danger"
                           title="Pulling code from git rewrites all non-commited code in the project!"
                    />
                </div>
            </Modal>
        )
    }

    function needCommit(): boolean {
        return project ? files.filter(f => f.lastUpdate > project.lastCommitTimestamp).length > 0 : false;
    }


    function getDate(lastUpdate: number): string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toISOString().slice(0, 19).replace('T',' ');
        } else {
            return "N/A"
        }
    }

    function getLastUpdatePanel() {
        const color = needCommit() ? "grey" : "green";
        const commit = project?.lastCommit;
        return (
            <Flex direction={{default: "row"}} justifyContent={{default: "justifyContentFlexStart"}}>
                {project?.lastCommitTimestamp > 0 &&
                    <FlexItem>
                        <Tooltip content="Last update" position={TooltipPosition.bottom}>
                            <Label color={color}>{getDate(project?.lastCommitTimestamp)}</Label>
                        </Tooltip>
                    </FlexItem>}
                {project?.lastCommitTimestamp > 0 &&
                    <FlexItem>
                        <Tooltip content={commit} position={TooltipPosition.bottom}>
                            <Label
                                color={color}>{commit ? commit?.substring(0, 18) : "-"}</Label>
                        </Tooltip>
                    </FlexItem>}
            </Flex>
        )
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    return <Flex className="toolbar" direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}}>
        {isKameletsProject() && <FlexItem align={{default: "alignLeft"}} flex={{default: "flex_3"}}>
            <Tooltip content="Load Custom Kamelets to Library" position={TooltipPosition.right}>
                <Button size="sm"
                        variant={"secondary"}
                        className="project-button dev-action-button"
                        icon={<RefreshIcon/>}
                        onClick={() => {
                            ProjectService.reloadKamelets();
                        }}>
                    Load
                </Button>
            </Tooltip>
        </FlexItem>}
        <FlexItem>{getLastUpdatePanel()}</FlexItem>
        <FlexItem>
            <Tooltip content="Pull from git" position={"bottom-end"}>
                <Button isLoading={isPulling ? true : undefined}
                        size="sm"
                        variant={"secondary"}
                        isDanger
                        className="project-button dev-action-button"
                        icon={!isPulling ? <PushIcon/> : <div></div>}
                        onClick={() => {
                            setPullIsOpen(true);
                        }}>
                    {isPulling ? "..." : "Pull"}
                </Button>
            </Tooltip>
        </FlexItem>
        <FlexItem>
            <Tooltip content="Commit and push to git" position={"bottom-end"}>
                <Button isLoading={isPushing ? true : undefined}
                        size="sm"
                        variant={"secondary"}
                        className="project-button dev-action-button"
                        icon={!isPushing ? <PushIcon/> : <div></div>}
                        onClick={() => {
                            setCommitMessage(commitMessage === '' ? new Date().toLocaleString() : commitMessage);
                            setCommitMessageIsOpen(true);
                        }}>
                    {isPushing ? "..." : "Push"}
                </Button>
            </Tooltip>
        </FlexItem>
        {isTemplates() && config.infrastructure === 'kubernetes' && <FlexItem>
            <Tooltip content="Update Build Script in Config Maps" position={"bottom-end"}>
                <Button className="dev-action-button"  size="sm" variant={"primary"} icon={<UpdateIcon/>}
                        onClick={e => updateScripts()}
                >
                    Update Script
                </Button>
            </Tooltip>
        </FlexItem>}
        {canAddFiles() && <FlexItem>
            <Button className="dev-action-button" size="sm" variant={"primary"} icon={<PlusIcon/>}
                    onClick={e => setFile("create")}>Create</Button>
        </FlexItem>}
        {canAddFiles() && <FlexItem>
            <Button className="dev-action-button" size="sm" variant="secondary" icon={<UploadIcon/>}
                    onClick={e => setFile("upload")}>Upload</Button>
        </FlexItem>}
        {getCommitModal()}
        {getPullModal()}
    </Flex>
}
