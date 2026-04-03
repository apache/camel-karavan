import {DashboardApi} from "@api/DashboardApi";
import {useHealthStore, useMetricStore} from "@stores/DashboardStore";

export class DashboardService {

    public static refreshAllHealth() {
        DashboardApi.getHealths(healths => {
            useHealthStore.setState({healths: healths});
        })
    }

    public static refreshAllMetrics() {
        DashboardApi.getMetrics(metrics => {
            useMetricStore.setState({metrics: metrics});
        })
    }
}