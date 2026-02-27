import React, {ReactElement} from 'react';
import {ProjectTitle} from "@features/project/ProjectTitle";
import {ProjectContainersContext} from "@features/project/ProjectContainersContextProvider";
import {ToggleGroup, ToggleGroupItem} from "@patternfly/react-core";
import {useProjectStore, useSelectedContainerStore} from "@stores/ProjectStore";
import {BuildIcon, CogIcon, RunningIcon} from "@patternfly/react-icons";
import {ContainerStatus} from "@models/ProjectModels";

interface Props {
    additionalTools?: ReactElement;
    hideContainersToggle?: boolean;
}

export function ProjectContainerContextToolbar(props: Props): ReactElement {

    const {additionalTools, hideContainersToggle} = props;
    const context = React.useContext(ProjectContainersContext);
    // if (!context) throw new Error("ProjectContainersContext not found!");
    // const {containerStatuses} = context ? context : undefined;
    const [selectedContainerName, setSelectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName, s.setSelectedContainerName]);
    const [tabIndex] = useProjectStore((s) => [s.tabIndex]);

    function getIcon(status: ContainerStatus) {
        if (status.type === "devmode") {
            const className = status.state === "running" ? 'project-container-devmode' : ''
            return <CogIcon className={className}/>
        } else if (status.type === "packaged") {
            const className = status.state === "running" ? 'project-container-package' : ''
            return <RunningIcon className={className}/>
        } else if (status.type === "build") {
            const className = status.state === "running" ? 'project-container-build' : ''
            return <BuildIcon className={className}/>
        }
    }

    function getContainers() {
        if (tabIndex !== 'build') {
            return context?.containerStatuses?.filter( cs => cs.type !== 'build') ?? [];
        } else {
            return context?.containerStatuses?.filter( cs => cs.type === 'build') ?? [];
        }
    }

    return (
        <div className="topology-toolbar">
            <div className="group-switch">
                <ProjectTitle/>
            </div>
            {additionalTools}
            {context && !hideContainersToggle && <div>
                <ToggleGroup aria-label="Default with single selectable">
                    {getContainers().map(status => (
                        <ToggleGroupItem
                            key={status.containerName}
                            icon={getIcon(status)}
                            text={status.containerName}
                            buttonId={status.containerName}
                            isSelected={selectedContainerName === status.containerName}
                            onChange={_ => setSelectedContainerName(status.containerName)}
                        />
                    ))}
                </ToggleGroup>
            </div>
            }
        </div>
    )
}
