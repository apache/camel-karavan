import {shallow} from "zustand/shallow";
import {useHealthStore} from "@stores/DashboardStore";
import {useAppConfigStore, useProjectsStore, useStatusesStore} from "@stores/ProjectStore";
import {ContainerStatus, ProjectType} from "@models/ProjectModels";
import TimeAgo from "javascript-time-ago";
import {useContainerStatusesStore} from "@stores/ContainerStatusesStore";
import {useProjectInfoStore} from "../../stores/ProjectInfoStore";

export function useDashboardHook() {

    const [projects] = useProjectsStore((s) => [s.projects], shallow)
    const [dockerInfo] = useAppConfigStore((s) => [s.dockerInfo], shallow)
    const {containers} = useContainerStatusesStore();
    const [healths] = useHealthStore((s) => [s.healths], shallow)
    const [camelStatuses] = useStatusesStore((state) => [state.camelContexts], shallow);
    const [projectInfos] = useProjectInfoStore(s => [s.projectInfos]);
    const [routes] = useStatusesStore((state) => [state.routes], shallow);

    let messagesSucceeded: number = 0;
    let messagesInflight: number = 0;
    let messagesFailed: number = 0;
    let lastFailedExchangeTimestamp: number = 0;

    camelStatuses.forEach(camelStatus => {
        const context = camelStatus.statuses.find(s => s.name === 'context');
        const statusText = context?.status;
        const status = statusText !== undefined ? JSON.parse(statusText) : {};
        const c = status?.context;
        messagesSucceeded = messagesSucceeded + ((c?.statistics?.exchangesTotal - c?.statistics?.exchangesFailed) || 0);
        messagesFailed = messagesFailed + (c?.statistics?.exchangesFailed ?? 0);
        messagesInflight = messagesInflight + (c?.statistics?.exchangesInflight ?? 0);
        if (c?.statistics?.lastFailedExchangeTimestamp > lastFailedExchangeTimestamp) {
            lastFailedExchangeTimestamp = c?.statistics?.lastFailedExchangeTimestamp;
        }
    })
    const timeAgo = new TimeAgo('en-US')
    const lastFailedString = lastFailedExchangeTimestamp ? new Date(lastFailedExchangeTimestamp).toISOString() : undefined;
    const lastFailedTime = lastFailedExchangeTimestamp ? timeAgo.format(new Date(lastFailedExchangeTimestamp), 'mini-now') : undefined;

    let cpuProcessUsage: number[] = [0]

    const lastUsage = (cpuProcessUsage.length > 1 ? cpuProcessUsage.at(cpuProcessUsage.length - 1) : 0) || 0;
    const fixed = lastUsage > 1 ? 1 : (lastUsage > 0.01 ? 2 : 4)

    function getGigabytes(bytes?: number): number {
        return bytes ? (bytes / 1024 / 1024 / 1024) : 0;
    }

    function getMemoryUsed(cs: ContainerStatus[]): number {
        const memories = cs.map(c => {
            const parts = c.memoryInfo?.split("/") || [];
            const mString = parts?.at(0) || "0";
            return parseFloat(mString.replace(/[^0-9.]/g, ''));
        });

        const memory = memories && memories.length > 0 ? memories.reduce((n1, n2) => n1 + n2) : 0;
        return getGigabytes(memory * 1024 * 1024);
    }

    const totalMemory = getGigabytes(dockerInfo?.MemTotal);
    const memoryUsed = getMemoryUsed(containers);
    const memoryProjects = getMemoryUsed(containers.filter(c => ['packaged', 'devmode'].includes(c.type)));
    const memoryOther = memoryUsed - memoryProjects;
    const freeMemory = totalMemory - memoryUsed;
    const memoryProjectsS = memoryProjects.toFixed(memoryProjects > 10 ? 1 : 1);
    const memoryOtherS = memoryOther.toFixed(memoryProjects > 10 ? 1 : 1);
    const freeMemoryS = freeMemory.toFixed(memoryProjects > 10 ? 1 : 1);

    const containerStatuses = containers.filter(p => ['packaged', 'devmode'].includes(p.type));
    const countTotal = containerStatuses.length;
    const countRunning = containerStatuses.filter(c => c.state === 'running').length;
    const countDown = countTotal - countRunning;

    const integrationsCount = projects.filter(p => p.type === ProjectType.integration).length;

    const healthTotal = healths.length;
    const healthUp = healths.filter(h => h.status === 'UP').length;
    const healthDown = countRunning - healthUp;

    const routesCount = projectInfos.reduce((sum, i) => sum + (i.routes?.length ?? 0), 0);
    const routeStateCounts = routes.reduce((acc, c) => {
        const statusJson = c.statuses?.[0]?.status;

        if (!statusJson) return acc;

        const status = JSON.parse(statusJson);
        const routeList = status?.route?.routes ?? [];

        for (const r of routeList) {
            if (!r.state) continue;
            acc[r.state] = (acc[r.state] ?? 0) + 1;
        }

        return acc;
    }, {} as Record<string, number>);


    return {
        totalMemory, memoryUsed, memoryProjects, memoryOther, freeMemory, memoryProjectsS, memoryOtherS, freeMemoryS,
        countTotal, countRunning, countDown, healthTotal, healthUp, healthDown, fixed, lastUsage,
        integrationsCount, messagesSucceeded, messagesInflight, messagesFailed, lastFailedExchangeTimestamp, lastFailedTime,
        routesCount, routeStateCounts
    }
}