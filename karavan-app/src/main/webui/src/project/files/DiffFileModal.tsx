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
    Modal,
    ModalVariant, Spinner
} from '@patternfly/react-core';
import './DiffFileModal.css';
import {useFileStore, useProjectStore} from "../../api/ProjectStore";
import {DiffEditor} from "@monaco-editor/react";
import {KaravanApi} from "../../api/KaravanApi";
import {ProjectFile} from "../../api/ProjectModels";
import {shallow} from "zustand/shallow";

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

export function DiffFileModal (prop: Props) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const {file, operation} = useFileStore();
    const [fileCommited, setFileCommited] = useState<string>();

    useEffect(() => {
        if (file && operation === 'diff') {
            KaravanApi.getFileCommited(project.projectId, file?.name, (fileCommited: ProjectFile) => {
                setFileCommited(fileCommited.code);
            });
        }
    }, [project, file, operation]);

    function closeModal () {
        useFileStore.setState({operation: "none"})
        setFileCommited(undefined)
    }

    const isOpen= operation === "diff";
    const extension = file?.name.split('.').pop();
    const language = extension && languages.has(extension) ? languages.get(extension) : extension;
    return (
            <Modal
                className='karavan-diff-modal'
                title="Diff"
                isOpen={isOpen}
                onClose={() => closeModal()}
                actions={[
                    <Button key="confirm" variant="primary" onClick={e => closeModal()}>Close</Button>,
                ]}
                onEscapePress={e => closeModal()}>
                {fileCommited === undefined && <Spinner size="lg" aria-label="spinner"/>}
                {fileCommited !== undefined && <DiffEditor language={language} original={fileCommited} modified={file?.code}/>}
            </Modal>
    )
}