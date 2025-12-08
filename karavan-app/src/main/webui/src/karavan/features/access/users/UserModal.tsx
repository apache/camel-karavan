import React, {useEffect} from 'react';
import {Alert, Button, Content, Form, FormAlert, FormGroup, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, TextInput,} from '@patternfly/react-core';
import {SubmitHandler, useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {useAccessStore} from "../../../stores/AccessStore";
import {useFormUtil} from "@util/useFormUtil";
import {EventBus} from "@features/integration/designer/utils/EventBus";
import {shallow} from "zustand/shallow";
import {AccessApi} from "../../../api/AccessApi";
import {getCurrentUser} from "@api/auth/AuthApi";
import {AccessService} from "@services/AccessService";
import {AccessUser} from "@models/AccessModels";


export function UserModal() {

    const [showUserModal, setShowUserModal, currentUser, users, roles]
        = useAccessStore((s) => [s.showUserModal, s.setShowUserModal, s.currentUser, s.users, s.roles], shallow);
    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<AccessUser>({mode: "all"});
    const {getTextField} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {
        if (isNewUser()) {
            reset(new AccessUser());
        } else {
            reset(currentUser);
        }
        setBackendError(undefined);
        setReset(true);
    }, [reset]);

    useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    function closeModal() {
        setShowUserModal(false)
    }

    const onSubmit: SubmitHandler<AccessUser> = (data) => {
        if (isNewUser()) {
            AccessApi.postUser(data, after)
        } else {
            AccessApi.putUser(data, after)
        }
    }

    function after(result: boolean, res: AxiosResponse<AccessUser> | any) {
        if (result) {
            onSuccess(res.data);
        } else {
            const data = res?.response?.data;
            const error = data && data !== '' ? data : res?.message;
            setBackendError(error);
        }
    }

    function onSuccess(user: AccessUser) {
        const message = `User ${user.username} successfully ` + (isNewUser() ? "created" : "updated");
        EventBus.sendAlert("Success", message, "success");
        closeModal();
        if (isNewUser()) {
            AccessService.refreshAccess();
        } else {
            if (getCurrentUser()?.username !== user.username) {
                AccessService.refreshAccess();
            }
        }
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter') {
            handleSubmit(onSubmit)()
        }
    }

    function isValidUsername(input: string): boolean {
        const pattern = /^[a-z][a-z0-9-]*$/;
        return pattern.test(input);
    }

    function isValidEmail(input: string): boolean {
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return pattern.test(input);
    }


    function canNotSubmit() {
        return Object.getOwnPropertyNames(errors).length > 0;
    }

    function isNewUser() {
        return currentUser === undefined;
    }

    function itsMe() {
        return currentUser?.username === getCurrentUser()?.username;
    }

    return (
        <Modal
            variant={ModalVariant.small}
            isOpen={showUserModal}
            onClose={closeModal}
            onKeyDown={onKeyDown}
        >
            <ModalHeader>
                <Content component='h2'>{isNewUser() ? "Add user" : "Update user"}</Content>
            </ModalHeader>
            <ModalBody>
                <Form isHorizontal={true} autoComplete="off">
                    {!isNewUser() &&
                        <FormGroup label="Username" fieldId='username' isRequired>
                            <TextInput className="text-field" type="text" id='username' value={currentUser?.username} isDisabled/>
                        </FormGroup>
                    }
                    {isNewUser() && getTextField('username', 'Username', {
                        regex: v => isValidUsername(v) || 'Only lowercase characters, numbers and dashes allowed',
                        length: v => v.length > 2 || 'Username should be longer that 2 characters',
                        name: v => !isNewUser() || !users.map(u => u.username).includes(v) || "User already exists!s",
                    })}
                    {getTextField('firstName', 'First Name', {
                        length: v => v.length > 0 || 'First name should not be empty',
                    })}
                    {getTextField('lastName', 'Last Name', {
                        length: v => v.length > 0 || 'Last name should not be empty',
                    })}
                    {getTextField('email', 'Email', {
                        length: v => v.length > 0 || 'Last name should not be empty',
                        email: v => isValidEmail(v) || 'Invalid email'
                    }, 'email')}
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