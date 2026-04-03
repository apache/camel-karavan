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
import {Alert, Button, FileUpload, Form, FormAlert, FormGroup, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant} from '@patternfly/react-core';
import {ProjectFile} from "@models/ProjectModels";
import {useFileStore, useProjectStore} from "@stores/ProjectStore";
import {Accept, DropEvent, FileRejection} from "react-dropzone";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {shallow} from "zustand/shallow";
import {ProjectService} from "@services/ProjectService";
import {SubmitHandler, useForm} from "react-hook-form";
import {KaravanApi} from "@api/KaravanApi";
import {AxiosResponse} from "axios";

export function UploadFileModal() {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [operation, setFile] = useFileStore((s) => [s.operation, s.setFile], shallow);
    const [isLoading, setIsLoading] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
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
    }, [reset, operation]);

    React.useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    const onSubmitAndClose: SubmitHandler<ProjectFile> = (data) => {
        onSubmit(data, false);
    }

    const onSubmitAndView: SubmitHandler<ProjectFile> = (data) => {
        onSubmit(data, true);
    }
    function onSubmit (data: ProjectFile, viewAfter: boolean) {
        data.projectId = project.projectId;
        KaravanApi.saveProjectFile(data, (result: boolean, file: AxiosResponse<ProjectFile> | any) => {
            if (result) {
                EventBus.sendAlert( "Success", "File successfully created", "success");
                ProjectService.refreshProjectData(project.projectId);
                if (viewAfter) {
                    setFile('select', file);
                } else {
                    closeModal();
                }
            } else {
                setBackendError(file?.response?.data);
            }
        })
    }

    function closeModal() {
        setFile("none");
    }

    const handleFileInputChange = (file: File) => setValue('name', file.name);
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
    const accept : Accept = {};
    return (
        <Modal
            variant={ModalVariant.small}
            isOpen={operation === 'upload'}
            onClose={closeModal}
        >
            <ModalHeader title="Upload"/>
            <ModalBody>
                <Form>
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
                    {backendError &&
                        <FormAlert>
                            <Alert variant="danger" title={backendError} aria-live="polite" isInline />
                        </FormAlert>
                    }
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button key="save-and-view" variant="primary"
                        onClick={handleSubmit(onSubmitAndView)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0 || fileNotUploaded}
                >
                    Save & View
                </Button>
                <Button key="save" variant="secondary"
                        onClick={handleSubmit(onSubmitAndClose)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0 || fileNotUploaded}
                >
                    Save
                </Button>
                <Button key="cancel" variant="tertiary" onClick={closeModal}>Cancel</Button>
            </ModalFooter>

        </Modal>
    )
}