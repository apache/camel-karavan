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
import {Alert, Button, Card, CardBody, CardFooter, CardHeader, Content, Form, FormAlert, FormGroup, FormHelperText, HelperText, HelperTextItem,} from '@patternfly/react-core';
import {SubmitHandler, useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {AccessPassword} from "../../../models/AccessModels";
import {useFormUtil} from "@util/useFormUtil";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {AuthApi} from "@api/auth/AuthApi";


export function ChangePassword() {

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
        AuthApi.setPassword(data, after)
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
        <Card>
            <CardHeader>
                <Content component='h2'>Change password</Content>
            </CardHeader>
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
        </Card>
    )
}