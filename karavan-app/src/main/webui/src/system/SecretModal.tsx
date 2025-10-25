import React, {useEffect} from 'react';
import {Button, Content, Form, Modal, ModalBody, ModalFooter, ModalHeader,} from "@patternfly/react-core";
import {SubmitHandler, useForm} from "react-hook-form";
import {useFormUtil} from "@/util/useFormUtil";
import {SystemApi} from "./SystemApi";
import {SystemService} from "./SystemService";

const validNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

interface Secret {
    name: string
}

interface Props {
    isOpen: boolean
    onAfterCreated: () => void
    onCancel: () => void
}

export function SecretModal(props: Props) {

    const [isReset, setReset] = React.useState(false);
    const formContext = useForm<Secret>({mode: "all"});
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


    const onSubmit: SubmitHandler<Secret> = (data) => {
        SystemApi.createSecret(data.name, val => {
            reset();
            props.onAfterCreated();
            SystemService.refresh();
        });
    }

    function cancel() {
        reset()
        props.onCancel();
    }

    const {isOpen, onCancel} = props;

    return (
        <Modal
            variant={"small"}
            isOpen={isOpen}
            onClose={() => onCancel()}
            onEscapePress={e => cancel()}>
            <ModalHeader>
                <Content component='h2'>Create secret</Content>
            </ModalHeader>
            <ModalBody>
                <Form isHorizontal={true} autoComplete="off" noValidate>
                    {getTextField('name', 'Secret', {
                        length: v => v.length < 253 || 'Name should  not be longer that 253 characters',
                        regex: v => validNameRegex.test(v) || 'Not a valid name',
                        start: v => !(v.startsWith('.') || v.startsWith('-') || v.endsWith('.') || v.endsWith('-')) || 'name should not start or end with \'.\' or \'-\'\n'
                    })}
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
