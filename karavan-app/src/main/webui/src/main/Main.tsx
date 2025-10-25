import React, {useContext, useEffect, useRef} from "react";
import './Main.css';
import {SsoApi} from "@/auth/SsoApi";
import {useAppConfigStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {PageNavigation} from "./PageNavigation";
import {useMainHook} from "./useMainHook";
import {Notification} from "@/designer/utils/Notification";
import {MainRoutes} from "@/custom/MainRoutes";
import {NotificationApi} from "@/api/NotificationApi";
import {ErrorEventBus} from "@/api/ErrorEventBus";
import {AuthContext} from "@/auth/AuthProvider";
import {ReadinessPanel} from "@/main/ReadinessPanel";
import {AuthApi, getCurrentUser} from "@/auth/AuthApi";
import {PLATFORM_DEVELOPER} from "@/access/AccessModels";

export function Main() {

    const [readiness] = useAppConfigStore((s) => [s.readiness], shallow)
    const controllerRef = useRef(new AbortController());
    const {getData} = useMainHook();
    const { user } = useContext(AuthContext);

    useEffect(() => {
        checkAuthType();
        const interval = setInterval(() => resetNotification(), 60000);
        const sub = ErrorEventBus.onApiError()?.subscribe(err => {
            console.log("ApiError", err?.config?.url, err)
            if (err?.response?.status === 401 && AuthApi.authType === 'sessionId') {
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
        } else if (AuthApi.authType === 'oidc') {
            SsoApi.auth(() => {

            });
        }
    }, [readiness, user]);

    function resetNotification() {
        console.log("Notification fetcher reset");
        try {
            controllerRef.current.abort()
            const controller = new AbortController();
            controllerRef.current = controller;
            NotificationApi.notification(controller);
        } catch (e) {
            console.error(e);
        }
    }

    function checkAuthType() {
        AuthApi.getAuthType((authType: string) => {
            console.log("Main AuthType", authType);
        });
    }

    function showMain() {
        return AuthApi.authType !== undefined && readiness?.status === true;
    }

    function isViewer(){
        return getCurrentUser()?.roles?.includes(PLATFORM_DEVELOPER);
    }

    return (
        <div className={isViewer() ? "viewer-group root-main karavan" : "root-main karavan"}>
            {user && <PageNavigation/>}
            <MainRoutes/>
            <Notification/>
            <ReadinessPanel/>
        </div>
    );
}
