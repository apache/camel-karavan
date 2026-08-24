import * as React from 'react';
import {useEffect, useState} from 'react';
import './Architecture.css';
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";
import {useStatusesStore} from "@stores/ProjectStore";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {ProjectService} from "@services/ProjectService";
import {useDeploymentStatusesStore} from "@stores/DeploymentStatusesStore";

export function ArchitectureRefresher() {

    const [count, setCount] = useState<number>();
    const [map, setMap] = useState<{projectId: string, state:string}[]>([]);

    const containers = useContainerStatusesStore(s => s.containers);
    const fetchDeployments = useDeploymentStatusesStore(s => s.fetchDeployments);

    useDataPolling('ArchitectureRefresherRefresherRuntime', refreshRuntime, 3000);
    useDataPolling('ArchitectureRefresherRefresherDesign', refreshDesign, 10000);

    function refreshDesign() {
        ProjectService.refreshProjects();
    }

    function refreshRuntime() {
        ProjectService.refreshAllContainerStatuses();
        ProjectService.refreshAllCamelProcessorStatuses();
        ProjectService.refreshAllCamelConsumerStatuses();
        ProjectService.refreshAllCamelContextStatuses();
        ProjectService.refreshAllCamelRouteStatuses();
        fetchDeployments();
    }

    useEffect(() => {
        let needRefresh = count === undefined;
        const containersCount = containers.length;
        if (containersCount !== count) {
            setCount(containersCount);
            needRefresh = true;
        } else {
            const containerMap = containers
                .filter(c => ['devmode', 'packaged'].includes(c.type))
                .sort((a, b) => a.projectId.localeCompare(b.projectId))
                .map(c => ({projectId: c.projectId, state: c.state}));
            if (!mapsEqualUnordered(containerMap, map)) {
                setMap(containerMap);
                needRefresh = true;
            }
        }
    }, [containers]);


    function mapsEqualUnordered(a: {projectId: string, state:string}[], b: {projectId: string, state:string}[]): boolean {
        const sortById = (arr: {projectId: string, state:string}[]) =>
            [...arr].sort((x, y) => x.projectId.localeCompare(y.projectId));

        const sortedA = sortById(a);
        const sortedB = sortById(b);

        return sortedA.length === sortedB.length &&
            sortedA.every((item, i) =>
                item.projectId === sortedB[i].projectId && item.state === sortedB[i].state
            );
    }

    return (
        <>{}</>
    );
}