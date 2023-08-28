import React, {useEffect} from 'react';

import {KaravanApi} from "../api/KaravanApi";
import '../designer/karavan.css';
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";

export function ProjectDataPoller () {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, setMemory, setJvm, setContext, refreshTrace, setTrace] = useProjectStore((s) =>
        [s.project, s.setMemory, s.setJvm, s.setContext, s.refreshTrace, s.setTrace], shallow);

    useEffect(() => {
        const interval = setInterval(() => onRefreshStatus(), 1000);
        return () => {
            clearInterval(interval)
        };
    }, [project, refreshTrace]);

    function onRefreshStatus() {
        const projectId = project.projectId;
        KaravanApi.getDevModeStatus(projectId, "memory", res => {
            if (res.status === 200) {
                setMemory(JSON.parse(res.data.status));
            } else {
                setMemory({});
            }
        })
        KaravanApi.getDevModeStatus(projectId, "jvm", res => {
            if (res.status === 200) {
                setJvm(JSON.parse(res.data.status));
            } else {
                setJvm({});
            }
        })
        KaravanApi.getDevModeStatus(projectId, "context", res => {
            if (res.status === 200) {
                setContext(JSON.parse(res.data.status));
            } else {
                setContext({});
            }
        })
        if (refreshTrace) {
            KaravanApi.getDevModeStatus(projectId, "trace", res => {
                if (res.status === 200) {
                    setTrace(JSON.parse(res.data.status));
                } else {
                    setTrace({});
                }
            })
        }
    }

    return (<></>)
}