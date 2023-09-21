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

import React, {useState} from 'react';
import {
    Bullseye, Card, CardBody, CardTitle, LoginForm, Text
} from '@patternfly/react-core';
import {KaravanApi} from "../api/KaravanApi";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ProjectEventBus} from "../api/ProjectEventBus";
import {EventBus} from "../designer/utils/EventBus";

export function MainLogin () {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [username, setUsername] = useState<string>();
    const [password, setPassword] = useState<string>();
    const [isValidUsername, setIsValidUsername] = useState<boolean>(true);
    const [isValidPassword, setIsValidPassword] = useState<boolean>(true);
    const [isRememberMeChecked, setIsRememberMeChecked] = useState<boolean>(false);

    function onLoginButtonClick(event: any) {
        event.preventDefault();
        if (username && password) {
            onLogin(username, password);
        }
    }

    function onLogin(username: string, password: string) {
        KaravanApi.auth(username, password, (res: any) => {
            if (res?.status === 200) {
            } else {
                EventBus.sendAlert("Error", "Incorrect username and/or password!", "danger")
            }
        });
    }

    return (
        <Bullseye>
            <Card isFlat isCompact>
                <CardTitle>
                    <img alt="karavan-logo" src="karavan-logo-light.png" className="login-logo"/>
                    <Text component="h3"
                          style={{width: "fit-content", marginLeft: "auto"}}>{config.version}</Text>
                </CardTitle>
                <CardBody>
                    <LoginForm
                        showHelperText={true}
                        usernameLabel="Username"
                        usernameValue={username}
                        onChangeUsername={(_event, value) => setUsername(value)}
                        isValidUsername={isValidUsername}
                        passwordLabel="Password"
                        passwordValue={password}
                        isShowPasswordEnabled
                        onChangePassword={(_event, value) => setPassword(value)}
                        isValidPassword={isValidPassword}
                        onLoginButtonClick={onLoginButtonClick}
                        loginButtonLabel="Log in"
                    />
                </CardBody>
            </Card>
        </Bullseye>
    );
}