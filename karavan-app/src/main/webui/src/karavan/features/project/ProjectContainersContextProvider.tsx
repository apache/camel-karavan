import React from 'react';
import {useAppConfigStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerStatus} from "@models/ProjectModels";
import {Label, Tooltip} from "@patternfly/react-core";
import {CogIcon, PackageIcon} from "@patternfly/react-icons";
import DevIcon from "@patternfly/react-icons/dist/esm/icons/dev-icon";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";

type ProjectContainersContextType = {
    containerStatuses: ContainerStatus[]
    packagedContainerStatuses: ContainerStatus[]
    devModeContainerStatus?: ContainerStatus
    devModeIsRunning: boolean;
    packagedIsRunning: boolean;
    buildIsRunning: boolean;
    origin: string;
    camelContext: any,
    containersStatusIcons: React.ReactElement<any>,
};

export const ProjectContainersContext = React.createContext<ProjectContainersContextType | undefined>(undefined);

type ProjectContainersContextEnvelopeProps = {
    children: React.ReactNode
};

export function ProjectContainersContextProvider({children}: ProjectContainersContextEnvelopeProps) {

    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const [project, camelStatuses] = useProjectStore((s) => [s.project, s.camelStatuses], shallow);
    const {containers} = useContainerStatusesStore();

    const containerStatuses = containers.filter(c => c.projectId === project?.projectId) || [];
    const packagedContainerStatuses = containerStatuses.filter(c => c.type === 'packaged') || [];
    const isProjectContainer = packagedContainerStatuses.length > 0;
    const packagedIsRunning = isProjectContainer && (packagedContainerStatuses.filter(c => c.state === 'running').length === packagedContainerStatuses.length);

    const devModeContainerStatus = containerStatuses.filter(c => c.type === 'devmode').at(0);
    const devModeIsRunning = devModeContainerStatus?.state === 'running';

    const buildContainerStatus = containerStatuses.filter(c => c.type === 'build').at(0);
    const buildIsRunning = buildContainerStatus?.state === 'running';

    const isKubernetes = config.infrastructure === 'kubernetes'

    const runningContainer = devModeIsRunning ? devModeContainerStatus : packagedContainerStatuses.find(c => c.state === 'running');

    const origin = 'http://' + (isKubernetes
            ? runningContainer?.podId + ':8080'
            : runningContainer?.containerName + ':8080'
    );

    const camelStatus = camelStatuses.filter(s => s.projectId === project.projectId).at(0);
    const contextValue = camelStatus?.statuses?.filter(x => x.name === 'context').at(0);
    const camelContext = contextValue ? JSON.parse(contextValue?.status || '') : {};

    const isRunning = packagedIsRunning || devModeIsRunning;
    const className = isRunning ? 'rotated-run' : ''
    const tooltip = devModeIsRunning ? 'Running dev mode' : 'Running packaged'
    const containersStatusIcons = (
        <div style={{flex: 2, display: 'flex', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center'}}>
            {isRunning &&
                <Tooltip content={tooltip} position='left'>
                    <Label variant='outline'>
                        <div style={{display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', gap: '3px'}}>
                            <CogIcon className={`${className} rotated-run-forward`}/>
                            {devModeIsRunning && <DevIcon className={className} width={32} height={32}/>}
                            {packagedIsRunning && <PackageIcon className={className} width={32} height={32}/>}
                        </div>
                    </Label>
                </Tooltip>
            }
        </div>
    )

    return (
        <ProjectContainersContext.Provider value={{containerStatuses, packagedContainerStatuses, devModeContainerStatus, devModeIsRunning, packagedIsRunning, origin, buildIsRunning, camelContext, containersStatusIcons}}>
            {children}
        </ProjectContainersContext.Provider>
    );
}
