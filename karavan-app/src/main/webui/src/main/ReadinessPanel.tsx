import React, {useEffect} from "react";
import {KaravanApi} from "@/api/KaravanApi";
import './Main.css';
import {useAppConfigStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";

export function ReadinessPanel() {

    const [setReadiness] = useAppConfigStore((s) => [s.setReadiness], shallow)

    useEffect(() => {
        KaravanApi.getReadiness(setReadiness);
        const interval = setInterval(() => KaravanApi.getReadiness(setReadiness), 7000)
        return () => clearInterval(interval);
    }, []);

    return (<></>);
}
