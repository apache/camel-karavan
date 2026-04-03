import React, {ReactElement} from 'react';
import {ProjectContainersContext} from "@features/project/ProjectContainersContextProvider";
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {InfoTabContext} from "@features/project/project-camel/InfoTabContext";

export function InfoPanel(): ReactElement {

    const [selectedContainerId] = useSelectedContainerStore((s) => [s.selectedContainerName]);
    const context = React.useContext(ProjectContainersContext);
    if (!context) throw new Error("ProjectContainersContext not found!");
    const {containerStatuses} = context;
    const containerStatus = containerStatuses.filter(cs => cs.containerName === selectedContainerId)?.at(0);
    return (
        containerStatus
        ? <InfoTabContext containerStatus={containerStatus}/>
        : <></>
    )
}
