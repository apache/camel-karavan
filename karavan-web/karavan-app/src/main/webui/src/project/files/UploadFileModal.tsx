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
    TextInput,
    Button, Modal, FormGroup, ModalVariant, Switch, Form, FileUpload, Radio
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {ProjectFile} from "../../api/ProjectModels";
import {KaravanApi} from "../../api/KaravanApi";
import {useFileStore} from "../../api/ProjectStore";
import {Accept, DropEvent, FileRejection} from "react-dropzone";
import {EventBus} from "../../designer/utils/EventBus";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../../api/ProjectService";

interface Props {
    projectId: string,
}

export function UploadFileModal(props: Props) {

    const [operation, setFile] = useFileStore((s) => [s.operation, s.setFile], shallow);
    const [type, setType] = useState<'integration' | 'openapi' | 'other'>('integration');
    const [filename, setFilename] = useState('');
    const [integrationName, setIntegrationName] = useState('');
    const [data, setData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [generateRest, setGenerateRest] = useState(true);
    const [generateRoutes, setGenerateRoutes] = useState(true);

    useEffect(() => {
        setFilename('')
        setData('')
        setType('integration')
    }, []);

    function closeModal () {
        setFile("none")
    }

    function saveAndCloseModal () {
        const file = new ProjectFile(filename, props.projectId, data, Date.now());
        console.log(file);
        if (type === "openapi"){
            KaravanApi.postOpenApi(file, generateRest, generateRoutes, integrationName, res => {
                if (res.status === 200) {
                    EventBus.sendAlert("File uploaded", "", "info")
                    closeModal();
                    ProjectService.refreshProjectData(props.projectId);
                } else {
                    closeModal();
                    EventBus.sendAlert("Error", res.statusText, "warning")
                }
            })
        } else {
            KaravanApi.postProjectFile(file, res => {
                if (res.status === 200) {
                    EventBus.sendAlert("File uploaded", "", "info")
                    closeModal();
                    ProjectService.refreshProjectData(props.projectId);
                } else {
                    closeModal();
                    EventBus.sendAlert("Error", res.statusText, "warning")
                }
            })
        }
    }

    const handleFileInputChange = (file: File) => setFilename(file.name);
    const handleFileReadStarted = (fileHandle: File) => setIsLoading(true);
    const handleFileReadFinished = (fileHandle: File) => setIsLoading(false);
    const handleTextOrDataChange = (data: string) => setData(data);
    const handleFileRejected = (fileRejections: FileRejection[], event: DropEvent) => setIsRejected(true);
    const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
        setFilename('');
        setData('');
        setIsRejected(false);
    };


    const fileNotUploaded = (filename === '' || data === '');
    const accept : Accept = type === 'integration'
        ? {'application/yaml': ['.yaml', '.yml']}
        :  {'application/yaml': ['.yaml', '.yml'], 'application/json': ['.json'], 'plain/text': ['.sql']};
    return (
        <Modal
            title="Upload"
            variant={ModalVariant.small}
            isOpen={operation === 'upload'}
            onClose={closeModal}
            actions={[
                <Button key="confirm" variant="primary" onClick={saveAndCloseModal} isDisabled={fileNotUploaded}>Save</Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
        >
            <Form>
                <FormGroup fieldId="type">
                    <Radio value="Integration" label="Integration yaml" name="Integration" id="Integration" isChecked={type === 'integration'}
                           onChange={(event, _) => setType(_ ? 'integration': 'openapi' )}
                    />{' '}
                    <Radio value="OpenAPI" label="OpenAPI json/yaml" name="OpenAPI" id="OpenAPI" isChecked={type === 'openapi'}
                           onChange={(event, _) => setType( _ ? 'openapi' : 'integration' )}
                    />
                    <Radio value="Other" label="Other" name="Other" id="Other" isChecked={type === 'other'}
                           onChange={(event, _) => setType( _ ? 'other' : 'integration' )}
                    />
                </FormGroup>
                <FormGroup fieldId="upload">
                    <FileUpload
                        id="file-upload"
                        value={data}
                        filename={filename}
                        type="text"
                        hideDefaultPreview
                        browseButtonText="Upload"
                        isLoading={isLoading}
                        onFileInputChange={(_event, fileHandle: File) => handleFileInputChange(fileHandle)}
                        onDataChange={(_event, data) => handleTextOrDataChange(data)}
                        onTextChange={(_event, text) => handleTextOrDataChange(text)}
                        onReadStarted={(_event, fileHandle: File) => handleFileReadStarted(fileHandle)}
                        onReadFinished={(_event, fileHandle: File) => handleFileReadFinished(fileHandle)}
                        allowEditingUploadedText={false}
                        onClearClick={handleClear}
                        dropzoneProps={{accept: accept, onDropRejected: handleFileRejected}}
                        validated={isRejected ? 'error' : 'default'}
                    />
                </FormGroup>
                {type === 'openapi' && <FormGroup fieldId="generateRest">
                    <Switch
                        id="generate-rest"
                        label="Generate REST DSL"
                        labelOff="Do not generate REST DSL"
                        isChecked={generateRest}
                        onChange={(_, checked) => setGenerateRest(checked)}
                    />
                </FormGroup>}
                {type === 'openapi' && generateRest && <FormGroup fieldId="generateRoutes">
                    <Switch
                        id="generate-routes"
                        label="Generate Routes"
                        labelOff="Do not generate Routes"
                        isChecked={generateRoutes}
                        onChange={(_, checked) => setGenerateRoutes(checked)}
                    />
                </FormGroup>}
                {type === 'openapi' && generateRest && <FormGroup fieldId="integrationName" label="Integration name">
                    <TextInput autoComplete="off"
                               id="integrationName"
                               type="text"
                               placeholder="Integration file name with yaml extension"
                               required
                               onChange={(_, value) => setIntegrationName(value)}
                    />
                </FormGroup>}
            </Form>
        </Modal>
    )
};