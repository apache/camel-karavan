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
                       timeout={['success', 'info', 'custom'].includes(e.variant) ? 1000 : 20000}
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