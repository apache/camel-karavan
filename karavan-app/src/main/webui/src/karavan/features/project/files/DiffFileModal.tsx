/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, {useEffect, useRef, useState} from 'react';
import {Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner} from '@patternfly/react-core';
import './DiffFileModal.css';
import {useFileStore, useProjectStore} from "@stores/ProjectStore";
import '@shared/monaco-setup';
import {DiffEditor} from "@monaco-editor/react";
import {KaravanApi} from "@api/KaravanApi";
import {ProjectFile} from "@models/ProjectModels";
import {shallow} from "zustand/shallow";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {ProjectService} from "@services/ProjectService";

const languages = new Map<string, string>([
    ['sh', 'shell'],
    ['md', 'markdown'],
    ['properties', 'ini'],
    ['java', 'java'],
    ['yaml', 'yaml'],
    ['json', 'json'],
    ['xml', 'xml']
])

interface Props {
    id: string
}

export function DiffFileModal(prop: Props) {
    const [project] = useProjectStore((s) => [s.project], shallow);
    const {file, operation} = useFileStore();
    const [fileCommited, setFileCommited] = useState<ProjectFile>();
    const editorRef = useRef<any>(null);

    // We use a local state to control rendering separately from the Store
    // to prevent the "disposed" race condition
    const [shouldRenderEditor, setShouldRenderEditor] = useState(false);

    useEffect(() => {
        if (operation === 'diff' && file) {
            KaravanApi.getFileCommited(project.projectId, file?.name, (fileCommited: ProjectFile) => {
                setFileCommited(fileCommited);
                setShouldRenderEditor(true);
            });
        } else {
            setShouldRenderEditor(false);
        }
    }, [project, file, operation]);

    const handleEditorDidMount = (editor: any) => {
        editorRef.current = editor;
    };

    function closeModal() {
        // 1. Manually detach models immediately
        if (editorRef.current) {
            editorRef.current.setModel(null);
        }
        // 2. Clear editor rendering before updating the global store
        setShouldRenderEditor(false);

        // 3. Small delay to let Monaco cleanup before the Modal UI disappears
        setTimeout(() => {
            useFileStore.setState({operation: "none"});
            setFileCommited(undefined);
        }, 100);
    }

    function undoChanges() {
        if (fileCommited) {
            KaravanApi.putProjectFile(fileCommited, result => {
                if (result.status === 200) {
                    EventBus.sendAlert("Success", "File reverted", "success");
                    ProjectService.refreshProjectData(project.projectId);
                    useFileStore.setState({operation: "none", file: undefined})
                    setFileCommited(undefined)
                }
            })
        }
    }

    const isOpen = operation === "diff";
    const extension = file?.name.split('.').pop();
    const language = extension && languages.has(extension) ? languages.get(extension) : extension;

    return (
        <Modal
            className='karavan-diff-modal'
            isOpen={isOpen}
            onClose={closeModal}
            onEscapePress={closeModal}>
            <ModalHeader title="Diff"/>
            <ModalBody>
                {fileCommited === undefined && <Spinner size="lg" aria-label="spinner"/>}

                {/* Using shouldRenderEditor + isOpen ensures the editor
                   is gone BEFORE the Modal fully unmounts
                */}
                {isOpen && shouldRenderEditor && fileCommited !== undefined && (
                    <DiffEditor
                        key={file?.name}
                        onMount={handleEditorDidMount}
                        language={language}
                        original={fileCommited.code}
                        modified={file?.code}
                        options={{
                            automaticLayout: true,
                            readOnly: true,
                            // This helps prevent some internal resize/render errors on unmount
                            scrollBeyondLastLine: false
                        }}
                    />
                )}
            </ModalBody>
            <ModalFooter>
                <Button key="undo" variant="warning" onClick={undoChanges}>Undo</Button>
                <Button key="close" variant="primary" onClick={closeModal}>Close</Button>
            </ModalFooter>
        </Modal>
    );
}