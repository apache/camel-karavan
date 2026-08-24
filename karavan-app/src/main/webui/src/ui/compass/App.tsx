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
import {useMainHook} from "@compass/useMainHook";
import {Notification} from "@designer/utils/Notification";
import {NotificationApi} from "@api/NotificationApi";
import {AuthContext} from "@api/auth/AuthProvider";
import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";
import {PLATFORM_DEVELOPER} from "@models/AccessModels";
import {ReadinessPanel} from "@compass/ReadinessPanel";
import {useReadinessStore} from "@stores/ReadinessStore";
import {useNavigate} from "react-router-dom";
import {useUIStore} from "@stores/useUIStore";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {ROUTES} from "@compass/navigation/Routes";
import {LoginPage} from "@login/LoginPage";
import AppCompass from "@compass/AppCompass";
import '@compass/App.css';
import {useGlobalShortcuts} from "@command-palette/CommandEventBus";


export function App() {

    const {readiness} = useReadinessStore();
    const {fetchBrand, customLogo} = useUIStore();
    const controllerRef = useRef(new AbortController());
    const {getData, showApplication} = useMainHook();
    const show = showApplication();
    const { user, loading, authType } = useContext(AuthContext);
    const navigate = useNavigate();
    useGlobalShortcuts();

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

    useEffect(() => {
        if (user && customLogo === undefined) {
            fetchBrand();
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

    // The username/password LoginPage belongs to the 'session' auth type only.
    // In 'oidc' mode SsoApi redirects the browser to Keycloak (onLoad: 'login-required'),
    // so rendering it while that redirect is in flight only produces a flash.
    function showLoginPage() {
        return !user && !loading && authType === 'session';
    }

    if (show) {
        return (
            <>
                <ReadinessPanel/>
                {user && <AppCompass/>}
                {showLoginPage() && <LoginPage/>}
                <Notification/>
            </>
        )
    } else {
        return (
            <div className={isViewer() ? "viewer-group root-main karavan" : "root-main karavan"}>
                {<ReadinessPanel/>}
            </div>
        )
    }
}
