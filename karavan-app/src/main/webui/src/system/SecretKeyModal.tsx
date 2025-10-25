import React, {useEffect} from 'react';
import {Button, Form, Modal, ModalBody, ModalFooter, ModalHeader,} from "@patternfly/react-core";
import {SubmitHandler, useForm} from "react-hook-form";
import {useFormUtil} from "../util/useFormUtil";
import {SystemApi} from "./SystemApi";
import {SystemService} from "./SystemService";

const validKeyRegex = /^[a-zA-Z0-9._-]+$/;

interface SecretKey {
    key: string
    value: string
}

interface Props {
    isOpen: boolean
    secretName: string
    onAfterCreate: (secretKey: SecretKey) => void
    onCancel: () => void
}

export function SecretKeyModal(props: Props) {

    const [isReset, setReset] = React.useState(false);
    const formContext = useForm<SecretKey>({mode: "all"});
    const {getTextField, getTextArea} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {

    }, [reset]);

    React.useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);


    const onSubmit: SubmitHandler<SecretKey> = (secretKey) => {
        SystemApi.setSecretValue(secretName, secretKey.key, secretKey.value, (val: string) => {
            SystemService.refresh();
            reset();
            props.onAfterCreate(secretKey);
        });
    }

    function cancel() {
        reset()
        props.onCancel()
    }

    const {secretName, isOpen, onCancel} = props;

    return (
        <Modal
            variant={"small"}
            isOpen={isOpen}
            onClose={() => onCancel()}
            onEscapePress={e => cancel()}>
            <ModalHeader title={"Create key for " + props.secretName}/>
            <ModalBody>
                <Form isHorizontal={true} autoComplete="off" noValidate>
                    {getTextField('key', 'Key', {
                        length: v => v.length < 253 || 'Key should  not be longer that 253 characters',
                        regex: v => validKeyRegex.test(v) || 'Not a valid key',
                        start: v => !(v.startsWith('.') || v.startsWith('-') || v.endsWith('.') || v.endsWith('-')) || 'Key should not start or end with \'.\' or \'-\'\n'
                    })}
                    {getTextField('value', 'Value', {})}
                </Form>
            </ModalBody>
            <ModalFooter>
                <Button key="confirm" variant="primary"
                        isDisabled={Object.getOwnPropertyNames(errors).length > 0}
                        onClick={event => handleSubmit(onSubmit)()}
                >
                    Confirm
                </Button>
                <Button key="cancel" variant="link" onClick={e => cancel()}>
                    Cancel
                </Button>
            </ModalFooter>
        </Modal>
    )
}
