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
import React, {useContext, useEffect, useRef} from "react";
import './App.css';
import {mainHook} from "./MainHook";
import {Notification} from "@features/project/designer/utils/Notification";
import {NotificationApi} from "@api/NotificationApi";
import {AuthContext} from "@api/auth/AuthProvider";
import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";
import {PLATFORM_DEVELOPER} from "@models/AccessModels";
import PageNavigation from "@app/navigation/PageNavigation";
import {MainRoutes} from "@app/navigation/MainRoutes";
import {ReadinessPanel} from "@app/ReadinessPanel";
import {useReadinessStore} from "@stores/ReadinessStore";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {useNavigate} from "react-router-dom";
import {ROUTES} from "@app/navigation/Routes";

export function App() {

    const {readiness} = useReadinessStore();
    const controllerRef = useRef(new AbortController());
    const {getData, showApplication} = mainHook();
    const show = showApplication();
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const interval = setInterval(() => resetNotification(), 60000);
        const sub = ErrorEventBus.onApiError()?.subscribe(err => {
            console.log("ApiError", err?.config?.url, err)
            if (err?.response?.status === 401 && AuthApi.authType === 'session') {
                navigate(ROUTES.LOGIN);
                window.location.reload();
            }
        });
        return () => {
            clearInterval(interval);
            sub?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (showMain()) {
            getData();
            resetNotification();
        }
    }, [readiness, user]);

    function resetNotification() {
        try {
            controllerRef.current.abort()
            const controller = new AbortController();
            controllerRef.current = controller;
            NotificationApi.notification(controller);
        } catch (e) {
            console.error(e);
        }
    }

    function showMain() {
        return AuthApi.authType !== undefined && readiness?.status === true;
    }

    function isViewer(){
        return getCurrentUser()?.roles?.includes(PLATFORM_DEVELOPER);
    }

    if (show) {
        return (
            <div className={isViewer() ? "viewer-group root-main karavan" : "root-main karavan"}>
                <ReadinessPanel/>
                {user && <PageNavigation/>}
                <MainRoutes/>
                <Notification/>
            </div>
        )
    } else {
        return (
            <div className={isViewer() ? "viewer-group root-main karavan" : "root-main karavan"}>
                {<ReadinessPanel/>}
            </div>
        )
    }
}
