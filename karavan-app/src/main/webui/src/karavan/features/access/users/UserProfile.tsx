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
import {Alert, Button, Card, CardBody, CardFooter, CardHeader, Content, Form, FormAlert, FormGroup, TextInput,} from '@patternfly/react-core';
import {SubmitHandler, useForm} from "react-hook-form";
import {AxiosResponse} from "axios";
import {AccessUser} from "../../../models/AccessModels";
import {useFormUtil} from "@util/useFormUtil";
import {EventBus} from "@features/project/designer/utils/EventBus";
import {AccessApi} from "../../../api/AccessApi";
import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";


function UserProfile() {

    const [isReset, setReset] = React.useState(false);
    const [backendError, setBackendError] = React.useState<string>();
    const formContext = useForm<AccessUser>({mode: "all"});
    const {getTextField, getPasswordField} = useFormUtil(formContext);
    const {
        formState: {errors},
        handleSubmit,
        reset,
        trigger
    } = formContext;

    useEffect(() => {
        AuthApi.getMe(user => {
        })
    }, []);

    useEffect(() => {
        var user = getCurrentUser();
        if (user) reset(user);
        setBackendError(undefined);
        setReset(true);
    }, [reset]);

    useEffect(() => {
        isReset && trigger();
    }, [trigger, isReset]);

    const onSubmit: SubmitHandler<AccessUser> = (data) => {
        AccessApi.putUser(data, after)
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
        const message = `User ${user.username} successfully updated`;
        EventBus.sendAlert("Success", message, "success");
    }

    function isValidEmail(input: string): boolean {
        const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return pattern.test(input);
    }

    function canNotSubmit() {
        return Object.getOwnPropertyNames(errors).length > 0;
    }

    return (
        <Card>
            <CardHeader>
                <Content component='h2'>User</Content>
            </CardHeader>
            <CardBody>
                <Form isHorizontal={true} autoComplete="off">
                    <FormGroup label="Username" fieldId='username' isRequired>
                        <TextInput className="text-field" type="text" id='username' value={getCurrentUser()?.username} isDisabled/>
                    </FormGroup>
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

export default UserProfile