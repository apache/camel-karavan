import React, {useEffect, useState} from 'react';
import {
    Alert,
    Button,
    Card,
    CardBody,
    CardFooter,
    CardHeader,
    CardTitle,
    Divider,
    ExpandableSection,
    Form,
    FormAlert,
    FormGroup,
    FormHelperText,
    HelperText,
    HelperTextItem,
} from '@patternfly/react-core';
import {SubmitHandler, useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {AccessPassword} from "@models/AccessModels";
import {useFormUtil} from "@utils/useFormUtil";
import {EventBus} from "@designer/utils/EventBus";
import {AuthApi} from "@api/auth/AuthApi";


export function ChangePassword() {

    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const [isExpanded, setIsExpanded] = useState(false);
    const onToggle = (_event: React.MouseEvent, isExpanded: boolean) => {
        setIsExpanded(isExpanded);
    };
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
        AuthApi.setPassword(data, after)
    }

    function after(result: boolean, res: AxiosResponse<AccessPassword> | any) {
        if (result) {
            onSuccess();
            setIsExpanded(false);
        } else {
            const data = res?.response?.data;
            const error = data && data !== '' ? data : res?.message;
            setBackendError(error);
        }
    }

    function onSuccess() {
        const message = `Password successfully updated`;
        EventBus.sendAlert("Success", message, "success");
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

    return (
        <Card isCompact>
            <CardHeader
                actions={{
                    hasNoOffset: false,
                    actions: [
                        <ExpandableSection
                            key={"expandable-section"}
                            toggleText={isExpanded ? 'Hide' : 'Change'}
                            onToggle={onToggle}
                            isExpanded={isExpanded}
                        >
                        </ExpandableSection>
                    ]
                }}
            >
                <CardTitle>Password</CardTitle>
            </CardHeader>
            {isExpanded && <Divider/>}
            {isExpanded &&
                <>
                    <CardBody>
                        <Form isHorizontal={true} autoComplete="off">
                            {getPasswordField('currentPassword', 'Current Password', {})}
                            {getPasswordField('password', 'Password', {})}
                            {getPasswordField('password2', 'Retype Password', {})}
                            {getPasswordError()}
                            {backendError &&
                                <FormAlert>
                                    <Alert variant="danger" title={backendError} aria-live="polite" isInline/>
                                </FormAlert>
                            }
                        </Form>
                    </CardBody>
                    <CardFooter style={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Button key="confirm" variant="primary"
                                onClick={handleSubmit(onSubmit)}
                                isDisabled={canNotSubmit()}
                        >
                            Save
                        </Button>
                    </CardFooter>
                </>
            }
        </Card>
    )
}