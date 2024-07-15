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

import React, {useEffect, useRef} from "react";
import {KaravanApi} from "../api/KaravanApi";
import {
    Flex,
    FlexItem,
    Page,
} from "@patternfly/react-core";
import {SsoApi} from "../api/SsoApi";
import {useAppConfigStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "./PageNavigation";
import {useMainHook} from "./useMainHook";
import {Notification} from "../designer/utils/Notification";
import {MainLoader} from "./MainLoader";
import {MainRoutes} from "./MainRoutes";
import {NotificationApi} from "../api/NotificationApi";
import "./main.css"

export function Main() {

    const [readiness, setReadiness, isAuthorized] =
        useAppConfigStore((s) => [s.readiness, s.setReadiness, s.isAuthorized], shallow)
    const controllerRef = useRef(new AbortController());
    const {getData} = useMainHook();

    useEffect(() => {
        checkAuthType();
        const interval = setInterval(() => {
            KaravanApi.getReadiness((r: any) => {
                setReadiness(r);
            })
        }, 10000)
        return () => {
            clearInterval(interval);
        };
    }, []);

    useEffect(() => {
        if (showMain()) {
            getData();
            resetNotification();
        } else if (KaravanApi.authType === 'oidc') {
            SsoApi.auth(() => {
                KaravanApi.getMe((user: any) => {
                    useAppConfigStore.setState({isAuthorized: true});
                });
            });
        }
    }, [readiness, isAuthorized]);

    function resetNotification() {
        console.log("Notification fetcher reset");
        if (isAuthorized || KaravanApi.authType === 'public') {
            controllerRef.current.abort()
            const controller = new AbortController();
            controllerRef.current = controller;
            NotificationApi.notification(controller);
        }
    }

    function checkAuthType() {
        KaravanApi.getAuthType((authType: string) => {
            console.log("Main AuthType", authType);
        });
    }

    function showMain() {
        return KaravanApi.authType !== undefined && readiness?.status === true && isAuthorized;
    }

    return (
        <Page className="karavan">
            {!showMain() && <MainLoader/>}
            {showMain() &&
                <div style={{display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '0', width: "100%", height: "100%"}}>
                    {<PageNavigation/>}
                    <div style={{height: "100%", flexGrow: '2'}}>
                        {<MainRoutes/>}
                    </div>
                </div>
            }
            <Notification/>
        </Page>
    );
};
