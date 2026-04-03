export class HealthValue {
    name: string = '';
    value: string = '';
}

export class Health {
    projectId: string = '';
    containerName: string = '';
    env: string = '';
    updateDateTime: number = 0;
    status: string = '';
    contextStatus: string = '';
    contextName: string = '';
    contextVersion: string = '';
    routesStatus: string = '';
    consumersStatus: string = '';
    errors: HealthValue[] = [];
}

export class Metric {
    projectId: string = '';
    containerName: string = '';
    env: string = '';
    updateDateTime: number = 0;

    inflightList: MetricValue[] = [];
    inflight: number = 0;
    totalList: MetricValue[] = [];
    total: number = 0;
    failedList: MetricValue[] = [];
    failed: number = 0;
    succeededList: MetricValue[] = [];
    succeeded: number = 0;

    maxHeap: number = 0;
    usedHeap: number = 0;

    maxNonHeap: number = 0;
    usedNonHeap: number = 0;

    cpuCount: number = 0;
    cpuProcessUsage: number = 0;
    cpuSystemUsage: number = 0;
    systemLoadAverage: number = 0;
    gcPauseSum: number = 0;
    gcPauseCount: number = 1;

    failedDiffList: MetricValue[] = [];
    failedDiff: number = 0;
    uptime: number = 0;
}

export class MetricValue {
    name: string = '';
    value: number = 0;
}

export class ProjectMetrics {
    exchangesTotal: number = 0;
    exchangesFailed: number = 0;
    exchangesInflight: number = 0;
    exchangesSucceeded: number = 0;


    constructor(exchangesTotal: number, exchangesFailed: number, exchangesInflight: number, exchangesSucceeded: number) {
        this.exchangesTotal = exchangesTotal;
        this.exchangesFailed = exchangesFailed;
        this.exchangesInflight = exchangesInflight;
        this.exchangesSucceeded = exchangesSucceeded;
    }
}

export const DashboardLayoutTypes = ['auto', 'manual'] as const;
