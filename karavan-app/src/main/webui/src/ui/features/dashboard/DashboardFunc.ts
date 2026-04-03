import {Metric, MetricValue} from "@models/DashboardModels";

export function getRoutesFromMetric(metric: Metric) {
    const routes: string[] = [];
    if (metric.inflightList) routes.push(...metric.inflightList.map(e => e.name));
    if (metric.failedList) routes.push(...metric.failedList.map(e => e.name));
    if (metric.succeededList) routes.push(...metric.succeededList.map(e => e.name));
    if (metric.totalList) routes.push(...metric.totalList.map(e => e.name));
    return routes;
}

export function merge(first: number[], second: number[]): number[] {
    if (first === undefined || first.length === 0) {
        return second;
    } else if (first.length > second.length) {
        return first.map((value, index) => value + (second.at(index) || 0));
    } else {
        return second.map((value, index) => value + (first.at(index) || 0));
    }
}

export function calculateSum(values: number[]) {
    if (values === undefined ||values.length === 0) {
        return 0;
    } else if (values.length === 1) {
        return values.at(0) || 0;
    }
    return values.map(v => v).reduce((a, b) => (a || 0) + b);
}

export function getValueFromMetricByRoute(routeId: string, values: MetricValue[]) {
    return values?.filter(v => v.name === routeId).map(v => v.value).at(0) || 0;
}

export function getMetricValueSum(values: MetricValue[]) {
    if (values.length === 0) {
        return 0;
    } else if (values.length === 1) {
        return values.at(0)?.value || 0;
    }
    return values.map(v => v.value).reduce((a, b) => (a || 0) + b);
}

export function getExchangesSum(metrics: Metric[], containerName?: string) {
    let inflight = 0;
    let failedDiff = 0;

    metrics.filter(m => containerName === undefined || m.containerName === containerName).forEach(m => {
        inflight = inflight + m.inflight;
        failedDiff = inflight + m.failedDiff;
    })
    return {inflight, failedDiff}
}

export function sumMetrics(metrics: Metric[]): Metric[] {
    const sumsByEnv: { [key: string]: Metric } = {};

    // Sum values for each `env`
    metrics.forEach(metric => {
        if (!sumsByEnv[metric.env]) {
            sumsByEnv[metric.env] = new Metric();
            sumsByEnv[metric.env].env = metric.env;
            sumsByEnv[metric.env].inflight = metric.inflight;
            sumsByEnv[metric.env].total = metric.total;
            sumsByEnv[metric.env].failed = metric.failed;
            sumsByEnv[metric.env].succeeded = metric.succeeded;
        } else {
            sumsByEnv[metric.env].inflight += metric.inflight;
            sumsByEnv[metric.env].total += metric.total;
            sumsByEnv[metric.env].failed += metric.failed;
            sumsByEnv[metric.env].succeeded += metric.succeeded;
        }
    });

    // Convert the sums map to an array of `Metric` instances
    return Object.values(sumsByEnv);
}

