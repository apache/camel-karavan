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
    Form,
    FormGroup,
    FormHelperText,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalVariant,
    TextInput,
    Tooltip,
    TooltipPosition
} from '@patternfly/react-core';
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useAppConfigStore, useFilesStore, useFileStore, useProjectStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectService} from "@/api/ProjectService";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {getShortCommit, isEmpty} from "@/util/StringUtils";
import {ProjectTitle} from "@/project/ProjectTitle";

export function FilesToolbar() {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [project, isPushing, isPulling] = useProjectStore((s) => [s.project, s.isPushing, s.isPulling], shallow)
    const [diff, selectedFileNames] = useFilesStore((s) => [s.diff, s.selectedFileNames], shallow);
    const [file, setFile] = useFileStore((s) => [s.file, s.setFile], shallow)
    const [commitMessageIsOpen, setCommitMessageIsOpen] = useState(false);
    const [pullIsOpen, setPullIsOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const isDev = config.environment === 'dev';

    useEffect(() => {
    }, [project, file]);

    function push() {
        setCommitMessageIsOpen(false);
        useProjectStore.setState({isPushing: true});
        ProjectService.pushProject(project, commitMessage, selectedFileNames);
    }

    function pull() {
        setPullIsOpen(false);
        ProjectService.pullProject(project.projectId);
    }

    function canAddFiles(): boolean {
        return !['templates'].includes(project.projectId);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        event.stopPropagation();
        if (event.key === 'Enter') {
            event.preventDefault();
            if (!isEmpty(commitMessage)) {
                push();
            }
        }
    }

    function getCommitModal() {
        return (
            <Modal
                title="Commit and push"
                variant={ModalVariant.small}
                isOpen={commitMessageIsOpen}
                onClose={() => setCommitMessageIsOpen(false)}
                onKeyDown={onKeyDown}
            >
                <ModalHeader title='Commit and Push'/>
                <ModalBody>
                    <Form autoComplete="off" isHorizontal className="create-file-form">
                        <FormGroup label="Message" fieldId="name" isRequired>
                            <TextInput id={'commitMessage'} value={commitMessage} onChange={(_, value) => setCommitMessage(value)}/>
                            <FormHelperText/>
                        </FormGroup>
                    </Form>
                </ModalBody>
                <ModalFooter>
                    <Button key="confirm" variant="primary" isDisabled={isEmpty(commitMessage)} onClick={() => push()}>Commit and push</Button>
                    <Button key="cancel" variant="secondary" onClick={() => setCommitMessageIsOpen(false)}>Cancel</Button>
                </ModalFooter>
            </Modal>
        )
    }

    function getPullModal() {
        return (
            <Modal
                title="Pull"
                variant={ModalVariant.small}
                isOpen={pullIsOpen}
                onClose={() => setPullIsOpen(false)}
            >
                <ModalHeader title='Pull' titleIconVariant={"danger"}/>
                <ModalBody>
                    <div>
                        <Alert customIcon={<PushIcon/>}
                               isInline
                               variant="danger"
                               title="Pulling code from git rewrites all non-commited code in the project!"
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button key="confirm" variant="danger" isDanger onClick={() => pull()}>Pull</Button>
                    <Button key="cancel" variant="primary" onClick={() => setPullIsOpen(false)}>Cancel</Button>
                </ModalFooter>

            </Modal>
        )
    }

    function needCommit(): boolean {
        return diff && Object.keys(diff).length > 0;
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function getDate(lastUpdate: number): string {
        if (lastUpdate) {
            const date = new Date(lastUpdate);
            return date.toISOString().slice(0, 19).replace('T', ' ');
        } else {
            return "N/A"
        }
    }

    function getLastUpdatePanel() {
        const color = needCommit() ? "grey" : "green";
        const commit = project?.lastCommit;
        return (
            <div style={{display: 'flex', gap: "8px", alignItems: "center"}}>
                {project?.lastCommitTimestamp > 0 &&
                    <Tooltip content="Last update" position={TooltipPosition.bottom}>
                        <Label style={{lineHeight: '25px'}} variant="filled" color={color}>{getDate(project?.lastCommitTimestamp)}</Label>
                    </Tooltip>
                }
                {project?.lastCommitTimestamp > 0 &&
                    <Tooltip content={commit} position={TooltipPosition.bottom}>
                        <Label style={{lineHeight: '25px'}} color={color}>{getShortCommit(commit)}</Label>
                    </Tooltip>
                }
            </div>
        )
    }

    return (
        <div className="project-files-toolbar">
            <ProjectTitle/>
            <Button icon={<RefreshIcon/>}
                    variant={"link"}
                    onClick={() => {
                        ProjectService.refreshProjectFiles(project.projectId);
                        useProjectStore.setState({isPushing: false});
                        useProjectStore.setState({isPulling: false});
                    }}
            />
            {getLastUpdatePanel()}
            <Tooltip content="Pull from git" position={"bottom-end"}>
                <Button isLoading={isPulling ? true : undefined}
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
            <Tooltip content="Commit and push to git" position={"bottom-end"}>
                <Button isLoading={isPushing ? true : undefined}
                        isDisabled={!isDev || selectedFileNames.length === 0}
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
            {canAddFiles() && !isKameletsProject() &&
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={"primary"}
                        icon={<PlusIcon/>}
                        onClick={e => setFile("create")}>Create</Button>
            }
            {canAddFiles() && isKameletsProject() &&
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant={"primary"}
                        icon={<PlusIcon/>}
                        onClick={e => setFile("create", undefined, 'kamelet')}>Create</Button>
            }
            {canAddFiles() &&
                <Button className="dev-action-button"
                        isDisabled={!isDev}
                        variant="secondary"
                        icon={<UploadIcon/>}
                        onClick={e => setFile("upload")}>Upload</Button>
            }
            {getCommitModal()}
            {getPullModal()}
        </div>
    )
}
