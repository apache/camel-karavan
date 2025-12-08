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
import {Button, Form, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant} from '@patternfly/react-core';
import {useFileStore, useProjectStore} from "@stores/ProjectStore";
import {RESERVED_WORDS} from "@models/ProjectModels";
import {shallow} from "zustand/shallow";
import {SubmitHandler, useForm} from "react-hook-form";
import {EventBus} from "@features/integration/designer/utils/EventBus";
import {isValidFileName} from "@util/StringUtils";
import {useFormUtil} from "@util/useFormUtil";
import {KaravanApi} from "@api/KaravanApi";

type FormValues = {
    newName: string;
};

interface RenameFileModalProps {
    show: boolean,
    onRename: () => void
    onClose: () => void
}

export function RenameFileModal({show, onClose, onRename}: RenameFileModalProps) {

    const [project] = useProjectStore((s) => [s.project], shallow);
    const [file] = useFileStore((s) => [s.file], shallow);
    const formContext = useForm<FormValues>({
        mode: "onChange",
        defaultValues: { newName: file?.name },
    });
    const {getTextField} = useFormUtil(formContext);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = formContext;

    useEffect(() => {
        reset({ newName: file?.name || "" });
    }, [file, reset]);

    function closeModal() {
        onClose();
    }

    const onSubmit: SubmitHandler<FormValues> = (data) => {
        if (file) {
            KaravanApi.renameProjectFile(project.projectId, file?.name, data.newName, (result: boolean, err?: Error | undefined) => {
                if (result) {
                    onRename();
                } else {
                    EventBus.sendAlert("Error", err?.message ?? "Error copying file!", "warning");
                }
            })
        }
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
            variant={ModalVariant.small}
            isOpen={show}
            onClose={closeModal}
            onKeyDown={onKeyDown}
        >
            <ModalHeader title='Rename file'/>
            <ModalBody>
                <Form autoComplete="off" isHorizontal className="create-file-form">
                    {getTextField('newName', 'Name', {
                        regex: v => isValidFileName(v) || 'Not a valid filename',
                        length: v => v.length > 5 || 'File name should be longer that 5 characters',
                        name: v => !(RESERVED_WORDS.concat(file?.name ?? '')).includes(v) || "Reserved word",
                    })}
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary" onClick={handleSubmit(onSubmit)}
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0}
                >
                    Save
                </Button>
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            </ModalFooter>
        </Modal>
    )
}