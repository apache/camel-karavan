import {useProjectStore} from "@stores/ProjectStore";

export function useCustomNodeHook() {

    const camelStatuses = useProjectStore(state => state.camelStatuses);

    function getRouteStatus(routeId: string): string {
        const route = camelStatuses[0]?.statuses.find(s => s.name === 'route');
        const statusText = route?.status;
        const status = statusText !== undefined ? JSON.parse(statusText) : {};
        const routes = status?.route?.routes;
        if (routes !== undefined && Array.isArray(routes)) {
            return routes.find(r => r.routeId === routeId)?.state ?? undefined;
        } else {
            return undefined;
        }
    }

    return {getRouteStatus}
}