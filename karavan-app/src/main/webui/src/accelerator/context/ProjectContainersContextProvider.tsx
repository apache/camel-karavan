import React from 'react';
import {useAppConfigStore, useProjectStore, useStatusesStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerStatus} from "@/api/ProjectModels";

type ProjectContainersContextType = {
    containerStatuses: ContainerStatus[]
    packagedContainerStatuses: ContainerStatus[]
    devModeContainerStatus?: ContainerStatus
    devModeIsRunning: boolean;
    packagedIsRunning: boolean;
    origin: string;
};

export const ProjectContainersContext = React.createContext<ProjectContainersContextType | undefined>(undefined);

type ProjectContainersContextEnvelopeProps = {
    children: React.ReactNode
};

export function ProjectContainersContextProvider({children}: ProjectContainersContextEnvelopeProps) {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [project] = useProjectStore((s) => [s.project], shallow);
    const [containers] = useStatusesStore((s) => [s.containers], shallow);

    const containerStatuses = containers.filter(c => c.projectId === project.projectId) || [];
    const packagedContainerStatuses = containerStatuses.filter(c => c.type === 'packaged') || [];
    const isProjectContainer = packagedContainerStatuses.length > 0;
    const packagedIsRunning = isProjectContainer && (packagedContainerStatuses.filter(c => c.state === 'running').length === packagedContainerStatuses.length);

    const devModeContainerStatus = containerStatuses.filter(c => c.type === 'devmode').at(0);
    const devModeIsRunning = devModeContainerStatus?.state === 'running';

    const isKubernetes = config.infrastructure === 'kubernetes'

    const runningContainer = devModeIsRunning ? devModeContainerStatus : packagedContainerStatuses.find(c => c.state === 'running');

    const origin = 'http://' + (isKubernetes
            ? runningContainer?.podId + ':8080'
            : runningContainer?.containerName + ':8080'
    );

    return (
        <ProjectContainersContext.Provider value={{containerStatuses, packagedContainerStatuses, devModeContainerStatus, devModeIsRunning, packagedIsRunning, origin}}>
            {children}
        </ProjectContainersContext.Provider>
    );
}
