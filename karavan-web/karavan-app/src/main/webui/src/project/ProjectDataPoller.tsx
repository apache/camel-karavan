import React, {useEffect} from 'react';

import {KaravanApi} from "../api/KaravanApi";
import '../designer/karavan.css';
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {CamelStatus} from "../api/ProjectModels";

export function ProjectDataPoller() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, setCamelStatuses, setCamelTraces, refreshTrace, setImages] = useProjectStore((s) =>
        [s.project, s.setCamelStatuses, s.setCamelTraces, s.refreshTrace, s.setImages], shallow);

    useEffect(() => {
        const interval = setInterval(() => onRefreshStatus(), 1000);
        return () => {
            clearInterval(interval)
        };
    }, [project, refreshTrace]);

    function onRefreshStatus() {
        const projectId = project.projectId;
        KaravanApi.getProjectCamelStatuses(projectId, config.environment, (res) => {
            if (res.status === 200) {
                setCamelStatuses(res.data);
            } else {
                setCamelStatuses([]);
            }
        })
        KaravanApi.getImages(project.projectId, (res: any) => {
            setImages(res)
        });
        if (refreshTrace) {
            KaravanApi.getProjectCamelTraces(projectId, config.environment, res => {
                if (res.status === 200) {
                    setCamelTraces(res.data);
                } else {
                    setCamelTraces([]);
                }
            })
        }
    }

    return (<></>)
}