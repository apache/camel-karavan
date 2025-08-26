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
    Form,
    FileUpload,
    FormAlert,
    Alert, Checkbox,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useProjectStore} from "../api/ProjectStore";
import {Accept, DropEvent, FileRejection} from "react-dropzone";
import {EventBus} from "../designer/utils/EventBus";
import {shallow} from "zustand/shallow";
import {ProjectService} from "../api/ProjectService";
import {SubmitHandler, useForm} from "react-hook-form";
import {KaravanApi} from "../api/KaravanApi";
import {AxiosResponse} from "axios";

class ProjectArchiveFileUploadForm {
    file?: File = undefined;
    overwriteExistingFiles: boolean = false;

    constructor(overwriteExistingFiles: boolean, file?: File) {
        this.overwriteExistingFiles = overwriteExistingFiles;
        this.file = file;
    }
}

export function UploadProjectModal() {

    const [operation] = useProjectStore((s) => [s.operation], shallow);
    const [isLoading, setIsLoading] = useState(false);
    const [isRejected, setIsRejected] = useState(false);
    const [isReset, setReset] = useState(false);
    const [backendError, setBackendError] = useState<string>();
    const formContext = useForm<ProjectArchiveFileUploadForm>({mode: "all"});
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger,
        setValue,
        getValues
    } = formContext;

    useEffect(() => {
        reset(new ProjectArchiveFileUploadForm(false));
        setBackendError(undefined);
        setReset(true);
    }, [reset, operation]);

    React.useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    const onSubmit: SubmitHandler<ProjectArchiveFileUploadForm> = (projectArchiveFile) => {
        if (projectArchiveFile.file) {
            const data = new FormData();
            data.append('overwriteExistingFiles', projectArchiveFile.overwriteExistingFiles.toString());
            data.append('file', projectArchiveFile.file);
            KaravanApi.uploadProjectArchiveFile(data, after);
        }
    }

    function after (result: boolean, data: AxiosResponse | any) {
        if (result) {
            onSuccess(data);
        } else {
            setBackendError(JSON.stringify(data?.response?.data));
        }
    }

    function onSuccess (data: any) {
        EventBus.sendAlert( "Success", "File successfully uploaded", "success");
        ProjectService.refreshProjects();
        closeModal();
    }

    function closeModal () {
        useProjectStore.setState({operation: "none"})
    }

    const handleFileInputChange = (_: DropEvent, file: File) => setValue('file', file, { shouldValidate: true });
    const handleFileRejected = (fileRejections: FileRejection[], event: DropEvent) => setIsRejected(true);
    const handleClear = (event: React.MouseEvent<HTMLButtonElement>) => {
        setValue('file', undefined);
        setValue('overwriteExistingFiles', false);
        setIsRejected(false);
        setBackendError(undefined);
        reset(new ProjectArchiveFileUploadForm(false));
    };
    const handleFileOverwriteCheckboxChange = (event: React.FormEvent<HTMLInputElement>, checked: boolean) => setValue('overwriteExistingFiles', checked, { shouldValidate: true });

    const fileNotUploaded = typeof getValues('file') === 'undefined';
    const accept : Accept = {};

    return (
        <Modal
            title="Upload"
            variant={ModalVariant.small}
            isOpen={operation === 'upload'}
            onClose={closeModal}
            actions={[
                <Button key="confirm" variant="primary"
                        onClick={handleSubmit(onSubmit)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0 || fileNotUploaded}
                >
                    Upload
                </Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
        >
            <Form>
                <FormGroup fieldId="upload">
                    <FileUpload
                        id="file-upload"
                        value={getValues('file')}
                        filename={getValues('file')?.name}
                        isLoading={isLoading}
                        onFileInputChange={handleFileInputChange}
                        onClearClick={handleClear}
                        dropzoneProps={{accept: accept, onDropRejected: handleFileRejected}}
                    />
                    <Checkbox
                        id="file-overwrite"
                        onChange={handleFileOverwriteCheckboxChange}
                        label="Overwrite existing files"
                        isChecked={getValues('overwriteExistingFiles')}
                    />
                </FormGroup>
                {backendError &&
                    <FormAlert>
                        <Alert variant="danger" title={backendError} aria-live="polite" isInline />
                    </FormAlert>
                }
            </Form>
        </Modal>
    )
}