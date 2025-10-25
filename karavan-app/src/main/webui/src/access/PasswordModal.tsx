import React, {useEffect} from 'react';
import {
    Alert,
    Button,
    Content,
    Form,
    FormAlert,
    FormGroup,
    FormHelperText,
    HelperText,
    HelperTextItem,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    ModalVariant,
} from '@patternfly/react-core';
import {SubmitHandler, useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {useAccessStore} from "./AccessStore";
import {useFormUtil} from "@/util/useFormUtil";
import {EventBus} from "@/designer/utils/EventBus";
import {shallow} from "zustand/shallow";
import {AccessPassword} from "@/access/AccessModels";
import {AccessApi} from "@/access/AccessApi";


export function PasswordModal() {

    const [showPasswordModal, setShowPasswordModal, currentUser]
        = useAccessStore((s) => [s.showPasswordModal, s.setShowPasswordModal, s.currentUser], shallow);
    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<AccessPassword>({mode: "all"});
    const {getPasswordField} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {
        reset(new AccessPassword());
        setBackendError(undefined);
        setReset(true);
    }, [reset]);

    useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    const onSubmit: SubmitHandler<AccessPassword> = (data) => {
        if (currentUser?.username)
            AccessApi.setPassword(currentUser.username, data, after)
    }

    function after(result: boolean, res: AxiosResponse<AccessPassword> | any) {
        if (result) {
            onSuccess();
        } else {
            const data = res?.response?.data;
            const error = data && data !== '' ? data : res?.message;
            setBackendError(error);
        }
    }

    function onSuccess() {
        const message = `Password successfully updated`;
        EventBus.sendAlert("Success", message, "success");
        closeModal()
    }

    function arePasswordsEqual() {
        const pwd1 = formContext.getValues('password');
        const pwd2 = formContext.getValues('password2');
        return pwd1 === pwd2;
    }

    function canNotSubmit() {
        return Object.getOwnPropertyNames(errors).length > 0 || !arePasswordsEqual();
    }

    function getPasswordError() {
        if (!arePasswordsEqual()) {
            return (<FormGroup>
                <FormHelperText>
                    <HelperText>
                        <HelperTextItem variant={'error'}>
                            Passwords should be equal!
                        </HelperTextItem>
                    </HelperText>
                </FormHelperText>
            </FormGroup>)
        }
    }

    function closeModal() {
        setShowPasswordModal(false)
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void {
        if (event.key === 'Enter') {
            handleSubmit(onSubmit)()
        }
    }

    return (
        <Modal
            variant={ModalVariant.small}
            isOpen={showPasswordModal}
            onClose={closeModal}
            onKeyDown={onKeyDown}
        >
            <ModalHeader>
                <Content component='h2'>{`Change password for user: ${currentUser?.username}`}</Content>
            </ModalHeader>
            <ModalBody>
                <Form isHorizontal={true} autoComplete="off">
                    {getPasswordField('currentPassword', 'Your Password', {})}
                    {getPasswordField('password', 'User Password', {})}
                    {getPasswordField('password2', 'Retype Password', {})}
                    {getPasswordError()}
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