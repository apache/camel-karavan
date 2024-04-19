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
    FormGroup,
    ModalVariant,
    Switch,
    Form,
    FileUpload,
    Radio,
    FormAlert,
    Alert,
    TextInputGroupMain, Text, TextVariants, TextInputGroup
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import { ProjectFile} from "../../api/ProjectModels";
import {useFileStore, useProjectStore} from "../../api/ProjectStore";
import {Accept, DropEvent, FileRejection} from "react-dropzone";
import {EventBus} from "../../designer/utils/EventBus";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../../api/ProjectService";
import {SubmitHandler, useForm} from "react-hook-form";
import {KaravanApi} from "../../api/KaravanApi";
import {AxiosResponse} from "axios";
import {useFormUtil} from "../../util/useFormUtil";

export function UploadFileModal() {

    const integrationExtension = '.camel.yaml'
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [operation, setFile] = useFileStore((s) => [s.operation, s.setFile], shallow);
    const [type, setType] = useState<'integration' | 'openapi' | 'other'>('integration');
    const [integrationName, setIntegrationName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [generateRest, setGenerateRest] = useState(true);
    const [generateRoutes, setGenerateRoutes] = useState(true);
    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<ProjectFile>({mode: "all"});
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger,
        setValue,
        getValues
    } = formContext;

    useEffect(() => {
        reset(new ProjectFile('', project.projectId, '', 0));
        setBackendError(undefined);
        setReset(true);
        setType('integration')
    }, [reset, operation]);

    React.useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    const onSubmit: SubmitHandler<ProjectFile> = (data) => {
        data.projectId = project.projectId;
        if (type === "openapi") {
            KaravanApi.postOpenApi(data, generateRest, generateRoutes, integrationName + integrationExtension, after)
        } else {
            KaravanApi.saveProjectFile(data, after)
        }
    }

    function after (result: boolean, file: AxiosResponse<ProjectFile> | any) {
        if (result) {
            onSuccess(file);
        } else {
            setBackendError(file?.response?.data);
        }
    }

    function onSuccess (file: ProjectFile) {
        EventBus.sendAlert( "Success", "File successfully created", "success");
        ProjectService.refreshProjectData(project.projectId);
        setFile('select', file);
    }

    function closeModal() {
        setFile("none");
    }

    const handleFileInputChange = (file: File) => setValue('name',file.name);
    const handleFileReadStarted = (fileHandle: File) => setIsLoading(true);
    const handleFileReadFinished = (fileHandle: File) => setIsLoading(false);
    const handleTextOrDataChange = (data: string) => setValue('code', data);
    const handleFileRejected = (fileRejections: FileRejection[], event: DropEvent) => setIsRejected(true);
    const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
        setValue('name', '');
        setValue('code', '');
        setIsRejected(false);
        setBackendError(undefined);
        reset(new ProjectFile('', project.projectId, '', 0));
    };

    const fileNotUploaded = (getValues('name') === '' || getValues('code') === '');
    const accept : Accept = type === 'integration'
        ? {'application/yaml': ['.yaml', '.yml']}
        : ( type === 'openapi'
                ? {'application/yaml': ['.yaml', '.yml'], 'application/json': ['.json']}
                : {}
        );
    return (
        <Modal
            title="Upload"
            variant={ModalVariant.small}
            isOpen={operation === 'upload'}
            onClose={closeModal}
            actions={[
                <Button key="confirm" variant="primary"
                        onClick={handleSubmit(onSubmit)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0 || fileNotUploaded || (type === "openapi" && integrationName?.length < 3)}
                >
                    Save
                </Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
        >
            <Form>
                <FormGroup fieldId="type">
                    <Radio value="Integration" label="Integration yaml" name="Integration" id="Integration" isChecked={type === 'integration'}
                           onChange={(event, _) => {
                               setType(_ ? 'integration': 'openapi' );
                           }}
                    />{' '}
                    <Radio value="OpenAPI" label="OpenAPI json/yaml" name="OpenAPI" id="OpenAPI" isChecked={type === 'openapi'}
                           onChange={(event, _) => {
                               setType( _ ? 'openapi' : 'integration' );
                           }}
                    />
                    <Radio value="Other" label="Other" name="Other" id="Other" isChecked={type === 'other'}
                           onChange={(event, _) => {
                               setType( _ ? 'other' : 'integration' );
                           }}
                    />
                </FormGroup>
                <FormGroup fieldId="upload">
                    <FileUpload
                        id="file-upload"
                        value={getValues('code')}
                        filename={getValues('name')}
                        type="text"
                        hideDefaultPreview
                        browseButtonText="Upload"
                        isLoading={isLoading}
                        onFileInputChange={(_event, fileHandle: File) => {
                            handleFileInputChange(fileHandle);
                        }}
                        onDataChange={(_event, data) => {
                            handleTextOrDataChange(data);
                        }}
                        onTextChange={(_event, text) => {
                            handleTextOrDataChange(text);
                        }}
                        onReadStarted={(_event, fileHandle: File) => handleFileReadStarted(fileHandle)}
                        onReadFinished={(_event, fileHandle: File) => handleFileReadFinished(fileHandle)}
                        allowEditingUploadedText={false}
                        onClearClick={handleClear}
                        dropzoneProps={{accept: accept, onDropRejected: handleFileRejected}}
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
                {type === 'openapi' && generateRest &&
                    <FormGroup fieldId="integrationName" label="Integration name">
                        <TextInputGroup className="text-field-with-suffix">
                            <TextInputGroupMain type="text" id={"integrationName"} autoComplete="off"
                                                value={integrationName}
                                                required
                                                onChange={(_, value) => setIntegrationName(value)}
                            >
                            </TextInputGroupMain>
                            <Text className='text-field-suffix' component={TextVariants.p}>{integrationExtension}</Text>
                        </TextInputGroup>
                    </FormGroup>
                }
                {backendError &&
                    <FormAlert>
                        <Alert variant="danger" title={backendError} aria-live="polite" isInline />
                    </FormAlert>
                }
            </Form>
        </Modal>
    )
}