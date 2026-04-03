import {useStatusesStore} from "@stores/ProjectStore";
import {ROUTES} from "@app/navigation/Routes";
import {useNavigate} from "react-router-dom";
import {ProjectMetrics} from "@models/DashboardModels";

export function DashboardDevelopmentHook() {

    const [camelStatuses] = useStatusesStore((s) => [s.camelContexts])
    const navigate = useNavigate();

    function selectFile(integration: string, fileName: string) {
        navigate(`${ROUTES.PROJECTS}/${integration}/${fileName}`);
    }

    function getIntegrationMetrics(projectId: string): ProjectMetrics {
        let remoteExchangesTotal: number = 0;
        let remoteExchangesFailed: number = 0;
        let remoteExchangesSucceeded: number = 0;
        let remoteExchangesInflight: number = 0;
        let exchangesTotal: number = 0;
        let exchangesFailed: number = 0;
        let exchangesInflight: number = 0;
        let exchangesSucceeded: number = 0;
        try {
            const statuses = camelStatuses.filter(c => c.projectId === projectId) || [];
            statuses.forEach(status => {
                const contextStatuses = status.statuses.filter(s => s.name === 'context') || [];
                contextStatuses.forEach(contextStatus => {
                    const contextStatusJson = contextStatus.status;
                    const statistics = (contextStatusJson ? JSON.parse(contextStatusJson) : {})?.context?.statistics;
                    remoteExchangesTotal = (statistics?.remoteExchangesTotal || 0) + remoteExchangesTotal;
                    remoteExchangesFailed = (statistics?.remoteExchangesFailed || 0) + remoteExchangesFailed;
                    remoteExchangesSucceeded = (remoteExchangesTotal - remoteExchangesFailed) + remoteExchangesSucceeded;
                    remoteExchangesInflight = (statistics?.remoteExchangesInflight || 0) + remoteExchangesInflight;

                    exchangesTotal = (statistics?.exchangesTotal || 0) + exchangesTotal;
                    exchangesFailed = (statistics?.exchangesFailed || 0) + exchangesFailed;
                    exchangesSucceeded = (exchangesTotal - exchangesFailed) + exchangesSucceeded;
                    exchangesInflight = (statistics?.exchangesInflight || 0) + exchangesInflight;
                })
            })
        } catch (e) {
            console.error(e);
        }
        return new ProjectMetrics(exchangesTotal, exchangesFailed, exchangesInflight, exchangesSucceeded);
    }

    return {
        selectFile
    }
}