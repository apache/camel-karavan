import * as React from 'react';
import {useEffect, useState} from 'react';
import {useProjectsStore, useStatusesStore} from "@stores/ProjectStore";
import {OperationStatistic} from "@models/CatalogModels";
import {ProjectService} from "@services/ProjectService";
import {useDataPolling} from "@shared/polling/useDataPolling";
import {DashboardService} from "@services/DashboardService";
import {INTERNAL_COMPONENTS} from "@core/api/ComponentApi";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";
import {useCommitsStore} from "@stores/CommitsStore";
import {useProjectInfoStore} from "@stores/ProjectInfoStore";

export function DashboardDevelopmentRefresher() {

    const {containers} = useContainerStatusesStore();
    const [consumers, processors] = useStatusesStore((s) => [s.consumers, s.processors]);
    const {fetchProjectsCommited} = useProjectsStore();
    const {fetchSystemCommits} = useCommitsStore();
    const [projectInfos, fetchProjectInfos] = useProjectInfoStore(s => [s.projectInfos, s.fetchProjectInfos]);
    const [count, setCount] = useState<number>(0);
    const [map, setMap] = useState<{projectId: string, state:string}[]>([]);

    useDataPolling('DashboardDevelopmentRefresherRuntime', refreshRuntime, 3000);
    useDataPolling('DashboardDevelopmentRefresherDesign', refreshDesign, 10000);

    function refreshDesign() {
        ProjectService.refreshProjects();
        fetchSystemCommits();
        fetchProjectsCommited();
        fetchProjectInfos();
    }

    function refreshRuntime() {
        ProjectService.refreshAllContainerStatuses();
        ProjectService.refreshAllCamelProcessorStatuses();
        ProjectService.refreshAllCamelConsumerStatuses();
        ProjectService.refreshAllDeploymentStatuses();
        ProjectService.refreshAllCamelContextStatuses();
        ProjectService.refreshAllCamelRouteStatuses();
        DashboardService.refreshAllHealth();
        DashboardService.refreshAllMetrics();
    }

    useEffect(() => {
        let needRefresh = false;
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
        if (needRefresh) {
            fetchProjectInfos();
        }
    }, [containers]);


    useEffect(() => {
        try {
            const stats: OperationStatistic[] = [];
            consumers?.forEach(consumer => {
                const consumerStats = consumer?.statuses?.find(s => s.name === 'consumer');
                const statusText = consumerStats?.status;
                (statusText ? JSON.parse(statusText) : {})?.consumer?.consumers?.forEach((consumerStatus: any) => {
                    if (consumerStatus?.remote) {
                        const stat = getConsumerStats(consumerStatus);
                        if (stat) {
                            stat.projectId = consumer.projectId;
                            stats.push(stat)
                        }
                    }
                });
            })
            processors?.forEach(processor => {
                const processorStats = processor?.statuses?.find(s => s.name === 'processor');
                const statusText = processorStats?.status;
                (statusText ? JSON.parse(statusText) : {})?.processor?.processors?.forEach((processorStatus: any) => {
                    const stat = getProcessorStats(processorStatus)
                    if (stat) {
                        stat.projectId = processor.projectId;
                        stats.push(stat);
                    }
                });
            })
        } catch (err) {
            console.error(err);
        }
    }, [consumers, processors, fetchProjectInfos]);


    function getConsumerStats(consumerStatus: any): OperationStatistic | null {
        try {
            const from = consumerStatus.uri?.split('://');
            const protocol = from?.[0]
            const address = from?.[1]
            const statistics = consumerStatus?.statistics;
            const failed: number = statistics?.exchangesFailed ?? 0;
            const inflight: number = statistics?.exchangesInflight ?? 0;
            const total: number = statistics?.exchangesTotal ?? 0;
            return {action: "receive", protocol, address, total, inflight, failed};
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function getProcessorStats(processorStatus: any): OperationStatistic | null {
        try {
            const dslName = processorStatus.processor;
            if (['to', 'poll'].includes(dslName)) {
                const routeId = processorStatus.routeId;
                const nodePrefixId = processorStatus.nodePrefixId;
                const id = processorStatus.id?.replace(nodePrefixId, "");
                const info = findProcessorInfoById(routeId, nodePrefixId, id);
                if (info) {
                    const protocol = info[0]
                    const address = info[1]
                    if (!INTERNAL_COMPONENTS.includes(protocol)) {
                        const statistics = processorStatus?.statistics;
                        const failed: number = statistics?.exchangesFailed ?? 0;
                        const inflight: number = statistics?.exchangesInflight ?? 0;
                        const total: number = statistics?.exchangesTotal ?? 0;
                        const action = dslName === "poll" ? "receive" : "send";
                        return {action, protocol, address, total, inflight, failed, };
                    }
                    return null;
                } else {
                    return null;
                }
            } else {
                return null;
            }
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function findProcessorInfoById(routeId:string, nodePrefixId: string, id: string): [string, string] | null{
        try {
            var componentInfo = projectInfos
                .map(i => i.routes.find(r => areNodeIdsEqual(nodePrefixId, r.nodePrefixId)))
                .filter(i => i !== undefined)
                .map(r => [...r.consumers, ...r.producers].filter(c => c.id === id)?.[0])
                .find(c => c !== undefined);
            var protocol = componentInfo?.name;
            var address = componentInfo?.parameters?.destinationName ?? componentInfo?.parameters?.topic ?? componentInfo?.parameters?.name;
            return (protocol && address) ? [protocol, address] : null;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function areNodeIdsEqual(a: string, b: string): boolean {
        const normalize = (str: string) => str?.replace(/-\d+$/, "");
        return normalize(a) === normalize(b);
    }

    function areStatsDifferent(stats1: OperationStatistic[], stats2: OperationStatistic[]): boolean {
        if (stats1.length !== stats2.length) return true;

        const key = (s: OperationStatistic) => `${s.action}␟${s.protocol}␟${s.address}`;

        const map2 = new Map<string, OperationStatistic>();
        for (const s of stats2) map2.set(key(s), s);

        if (map2.size !== stats2.length) {
            return true;
        }

        for (const s1 of stats1) {
            const k = key(s1);
            const s2 = map2.get(k);
            if (!s2) return true; // missing -> new/removed
            if (
                s1.total !== s2.total ||
                s1.inflight !== s2.inflight ||
                s1.failed !== s2.failed
            ) {
                return true; // values changed
            }
        }
        const set1 = new Set(stats1.map(key));
        if (set1.size !== stats1.length) return true;
        return false;
    }

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