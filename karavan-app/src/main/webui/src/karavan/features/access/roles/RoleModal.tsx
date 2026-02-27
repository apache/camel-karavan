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
import {Alert, Button, Content, Form, FormAlert, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant,} from '@patternfly/react-core';
import {SubmitHandler, useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {AccessRole} from "../../../models/AccessModels";
import {useAccessStore} from "../../../stores/AccessStore";
import {useFormUtil} from "@util/useFormUtil";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {shallow} from "zustand/shallow";
import {AccessApi} from "../../../api/AccessApi";
import {AccessService} from "@services/AccessService";


export function RoleModal() {

    const [showRoleModal, setShowRoleModal, roles]= useAccessStore((s) => [s.showRoleModal, s.setShowRoleModal, s.roles], shallow);
    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<AccessRole>({mode: "all"});
    const {getTextField} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {
        reset(new AccessRole());
        setBackendError(undefined);
        setReset(true);
    }, [reset]);

    useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    function closeModal() {
        setShowRoleModal(false)
    }

    const onSubmit: SubmitHandler<AccessRole> = (data) => {
        AccessApi.postRole(data, after)
    }

    function after(result: boolean, res: AxiosResponse<AccessRole> | any) {
        if (result) {
            onSuccess(res.data);
        } else {
            const data = res?.response?.data;
            const error = data && data !== '' ? data : res?.message;
            setBackendError(error);
        }
    }

    function onSuccess(role: AccessRole) {
        const message = `Role ${role.name} successfully created`;
        EventBus.sendAlert("Success", message, "success");
        closeModal();
        AccessService.refreshAccess();
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter') {
            handleSubmit(onSubmit)()
        }
    }

    function isValidName(input: string): boolean {
        return !roles.map(r => r.name).includes(input);
    }

    function canNotSubmit() {
        return Object.getOwnPropertyNames(errors).length > 0;
    }

    return (
        <Modal
            variant={ModalVariant.small}
            isOpen={showRoleModal}
            onClose={closeModal}
            onKeyDown={onKeyDown}
        >
            <ModalHeader>
                <Content component='h2'>Add role</Content>
            </ModalHeader>
            <ModalBody>
                <Form isHorizontal={true} autoComplete="off">
                    {getTextField('name', 'Name', {
                        length: v => v.length > 0 || 'Name should not be empty',
                        name: v => isValidName(v) || "Role already exists!s",
                    })}
                    {getTextField('description', 'Description', {
                        length: v => v.length > 0 || 'Description should not be empty',
                    })}
                    {backendError &&
                        <FormAlert>
                            <Alert variant="danger" title={backendError} aria-live="polite" isInline/>
                        </FormAlert>
                    }
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary"
                        onClick={handleSubmit(onSubmit)}
                        isDisabled={canNotSubmit()}
                >
                    Save
                </Button>
                <Button key="cancel" variant="secondary" onClick={closeModal}>Cancel</Button>
            </ModalFooter>
        </Modal>
    )
}