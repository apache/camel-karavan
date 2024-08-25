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
    Modal, Spinner
} from '@patternfly/react-core';
import './DiffFileModal.css';
import {useFileStore, useProjectStore} from "../../api/ProjectStore";
import {DiffEditor} from "@monaco-editor/react";
import {KaravanApi} from "../../api/KaravanApi";
import {ProjectFile} from "../../api/ProjectModels";
import {shallow} from "zustand/shallow";
import {EventBus} from "../../designer/utils/EventBus";
import {ProjectService} from "../../api/ProjectService";

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
    const {file, operation, setFile} = useFileStore();
    const [fileCommited, setFileCommited] = useState<ProjectFile>();

    useEffect(() => {
        if (file && operation === 'diff') {
            KaravanApi.getFileCommited(project.projectId, file?.name, (fileCommited: ProjectFile) => {
                setFileCommited(fileCommited);
            });
        }
    }, [project, file, operation]);

    function closeModal() {
        useFileStore.setState({operation: "none"})
        setFileCommited(undefined)
    }

    function undoChanges() {
        if (fileCommited) {
            KaravanApi.putProjectFile(fileCommited, result => {
                if (result.status === 200) {
                    EventBus.sendAlert( "Success", "File reverted", "success");
                    ProjectService.refreshProjectData(project.projectId);
                    useFileStore.setState({operation: "none"})
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
            title="Diff"
            isOpen={isOpen}
            onClose={() => closeModal()}
            actions={[
                <div style={{display: "flex", flexDirection: 'row', justifyContent: 'space-between', width: "100%"}}>
                    <Button key="confirm" variant="warning" onClick={e => undoChanges()}>Undo</Button>
                    <Button key="confirm" variant="primary" onClick={e => closeModal()}>Close</Button>
                </div>
            ]}
            onEscapePress={e => closeModal()}>
            {fileCommited === undefined && <Spinner size="lg" aria-label="spinner"/>}
            {fileCommited !== undefined && <DiffEditor language={language} original={fileCommited.code} modified={file?.code}/>}
        </Modal>
    )
}