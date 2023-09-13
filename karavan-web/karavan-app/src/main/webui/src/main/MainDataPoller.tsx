import React, {useEffect, useState} from 'react';

import {KaravanApi} from "../api/KaravanApi";
import '../designer/karavan.css';
import {
    CamelStatus,
    ContainerStatus,
    DeploymentStatus,
    Project,
    ServiceStatus
} from "../api/ProjectModels";
import {useAppConfigStore, useProjectsStore, useProjectStore, useStatusesStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";

export function MainDataPoller () {

    const [config, setLoading, readiness, setReadiness] = useAppConfigStore((s) =>
        [s.config, s.setLoading, s.readiness, s.setReadiness], shallow)
    const [projects, setProjects] = useProjectsStore((state) => [state.projects, state.setProjects], shallow)
    const [deployments, services, containers, camels, setDeployments, setServices, setContainers, setCamels]
        = useStatusesStore((s) => [s.deployments, s.services, s.containers, s.camels,
        s.setDeployments, s.setServices, s.setContainers, s.setCamels], shallow);

    const [project] = useProjectStore((state) => [state.project], shallow )

    useEffect(() => {
        const interval = setInterval(() => getData(), 1300)
        return () => {
            clearInterval(interval);
        };
    }, [project, readiness]);

    function getData() {
        KaravanApi.getReadiness((r: any) => {
            setReadiness(r);
        })
        if (readiness) {
            setLoading(true);
            if (project.projectId === undefined) {
                KaravanApi.getProjects((projects: Project[]) => {
                    setProjects(projects);
                });
            }
            KaravanApi.getAllDeploymentStatuses((statuses: DeploymentStatus[]) => {
                setDeployments(statuses);
            });
            KaravanApi.getAllServiceStatuses((statuses: ServiceStatus[]) => {
                setServices(statuses);
            });
            KaravanApi.getAllContainerStatuses((statuses: ContainerStatus[]) => {
                setContainers(statuses);
            });
            KaravanApi.getAllCamelContextStatuses(config.environment, (statuses: CamelStatus[]) => {
                setCamels(statuses);
            });
            setLoading(false);
        }
    }

    return (<></>)
}