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

import React, {useEffect, useState} from 'react';
import {
    Alert,
    AlertActionCloseButton, AlertGroup,
} from '@patternfly/react-core';
import '../karavan.css';
import {EventBus, ToastMessage} from "./EventBus";

export function Notification () {

    const [alerts, setAlerts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const sub = EventBus.onAlert()?.subscribe((result: ToastMessage) => {
            setAlerts(prevState => {
                return [...prevState, result];
            });
        });
        return () => {
            sub?.unsubscribe();
        };
    }, []);

    useEffect(() => {
    }, [alerts]);

    return (
        <AlertGroup isToast isLiveRegion>
            {alerts.map((e: ToastMessage) => (
                <Alert key={e.id} className="main-alert" variant={e.variant} title={e.title}
                       timeout={['success', 'info', 'custom'].includes(e.variant) ? 2300 : 20000}
                       actionClose={<AlertActionCloseButton onClose={() => {
                           setAlerts(prevState => {
                               return [...prevState.filter(t => t.id !== e.id)];
                           });
                       }}/>}>
                    {e.text}
                </Alert>
            ))}
        </AlertGroup>
    )
}