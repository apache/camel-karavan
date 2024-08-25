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

import React, {useEffect} from 'react';
import {
    Button,
    Modal,
    ModalVariant,
    Form,
    Alert, FormAlert,
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import {useFileStore, useProjectStore} from "../../api/ProjectStore";
import {getProjectFileTypeName, ProjectFile} from "../../api/ProjectModels";
import {ProjectService} from "../../api/ProjectService";
import {shallow} from "zustand/shallow";
import {SubmitHandler, useForm} from "react-hook-form";
import {EventBus} from "../../designer/utils/EventBus";
import {isValidFileName} from "../../util/StringUtils";
import {useFormUtil} from "../../util/useFormUtil";
import {KaravanApi} from "../../api/KaravanApi";
import {CodeUtils} from "../../util/CodeUtils";

export function CreateFileModal() {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [operation, setFile] = useFileStore((s) => [s.operation, s.setFile], shallow);
    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<ProjectFile>({mode: "all"});
    const {getTextField} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {
        reset(new ProjectFile('', project.projectId, '', 0));
        setBackendError(undefined);
        setReset(true);
    }, [reset, operation]);

    React.useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    function closeModal() {
        setFile("none");
    }

    const onSubmit: SubmitHandler<ProjectFile> = (data) => {
        data.projectId = project.projectId;
        data.code = CodeUtils.getCodeForNewFile(data.name, getProjectFileTypeName(data));
        KaravanApi.saveProjectFile(data, (result, file) => {
            if (result) {
                onSuccess(file);
            } else {
                setBackendError(file?.response?.data);
            }
        })
    }

    function onSuccess (file: ProjectFile) {
        EventBus.sendAlert( "Success", "File successfully created", "success");
        ProjectService.refreshProjectData(project.projectId);
        setFile('select', file);
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter') {
            event.preventDefault();
            event.stopPropagation();
            handleSubmit(onSubmit)();
        }
    }

    return (
        <Modal
            title="Create file"
            variant={ModalVariant.small}
            isOpen={["create", "copy"].includes(operation)}
            onClose={closeModal}
            onKeyDown={onKeyDown}
            actions={[
                <Button key="confirm" variant="primary" onClick={handleSubmit(onSubmit)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0}
                >
                    Save
                </Button>,
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            ]}
        >
            <Form autoComplete="off" isHorizontal className="create-file-form">
                {getTextField('name', 'Name', {
                    regex: v => isValidFileName(v) || 'Not a valid filename',
                    length: v => v.length > 5 || 'File name should be longer that 5 characters',
                    name: v => !['templates', 'kamelets', 'karavan'].includes(v) || "'templates', 'kamelets', 'karavan' can't be used as filename",
                })}
                {backendError &&
                    <FormAlert>
                        <Alert variant="danger" title={backendError} aria-live="polite" isInline />
                    </FormAlert>
                }
            </Form>
        </Modal>
    )
}