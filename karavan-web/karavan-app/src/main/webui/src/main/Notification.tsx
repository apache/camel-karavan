import React, {useEffect, useState} from 'react';
import {
    Alert,
    AlertActionCloseButton, AlertGroup,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {ToastMessage} from "../api/ProjectModels";
import {ProjectEventBus} from "../api/ProjectEventBus";

export function Notification () {

    const [alerts, setAlerts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        console.log("Notification Start");
        const sub = ProjectEventBus.onAlert()?.subscribe((result: ToastMessage) => {
            console.log(result);
            setAlerts(prevState => {
                return [...prevState, result];
            });
        });
        return () => {
            console.log("end");
            sub?.unsubscribe();
        };
    }, []);

    useEffect(() => {
        console.log("Notification alert");
    }, [alerts]);

    return (
        <AlertGroup isToast isLiveRegion>
            {alerts.map((e: ToastMessage) => (
                <Alert key={e.id} className="main-alert" variant={e.variant} title={e.title}
                       timeout={e.variant === "success" ? 1000 : 2000}
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