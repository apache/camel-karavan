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
    Button,
    Flex,
    FlexItem, Form, FormGroup, FormHelperText, Label, Modal, ModalVariant, TextInput, Tooltip, TooltipPosition,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {useFilesStore, useFileStore, useProjectStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../../api/ProjectService";
import PushIcon from "@patternfly/react-icons/dist/esm/icons/code-branch-icon";

export const FileToolbar = () => {

    const [commitMessageIsOpen, setCommitMessageIsOpen] = useState(false);
    const [commitMessage, setCommitMessage] = useState('');
    const [project, isPushing] = useProjectStore((state) => [state.project, state.isPushing], shallow )
    const {files} = useFilesStore();
    const [file, editAdvancedProperties, setEditAdvancedProperties, setAddProperty] = useFileStore((state) =>
        [state.file, state.editAdvancedProperties, state.setEditAdvancedProperties, state.setAddProperty], shallow )


    useEffect(() => {
    }, [project, file]);

    function push () {
        setCommitMessageIsOpen(false);
        ProjectService.pushProject(project, commitMessage);
    }

    function getCommitModal() {
        return (
            <Modal
                title="Commit"
                variant={ModalVariant.small}
                isOpen={commitMessageIsOpen}
                onClose={() => setCommitMessageIsOpen(false)}
                actions={[
                    <Button key="confirm" variant="primary" onClick={() => push()}>Save</Button>,
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

    return <Flex className="toolbar" direction={{default: "row"}} justifyContent={{default: "justifyContentFlexEnd"}}>
        <FlexItem>{getLastUpdatePanel()}</FlexItem>
        <FlexItem>
            <Tooltip content="Commit and push to git" position={"bottom-end"}>
                <Button isLoading={isPushing ? true : undefined}
                        size="sm"
                        variant={needCommit() ? "primary" : "secondary"}
                        className="project-button"
                        icon={!isPushing ? <PushIcon/> : <div></div>}
                        onClick={() => {
                            setCommitMessage(commitMessage === '' ? new Date().toLocaleString() : commitMessage);
                            setCommitMessageIsOpen(true);
                        }}>
                    {isPushing ? "..." : "Push"}
                </Button>
            </Tooltip>
        </FlexItem>
        <FlexItem>
            <Button size="sm" variant={"secondary"} icon={<PlusIcon/>}
                    onClick={e => useFileStore.setState({operation:"create"})}>Create</Button>
        </FlexItem>
        <FlexItem>
            <Button size="sm" variant="secondary" icon={<UploadIcon/>}
                    onClick={e => useFileStore.setState({operation:"upload"})}>Upload</Button>
        </FlexItem>
        {getCommitModal()}
    </Flex>
}
