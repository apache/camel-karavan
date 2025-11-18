import * as React from 'react';
import {useProjectStore} from "@/api/ProjectStore";

interface Props {
    routeId: string
}

export function CustomNodeMetricAttachment(props: Props) {

    const routeId = props.routeId;
    const camelStatuses = useProjectStore((state) => state.camelStatuses);
    const camelStatus = camelStatuses[0];
    const routes = camelStatus?.statuses?.find(s => s.name === 'route');
    const statusText = routes?.status;
    const routeStatus = (statusText ? JSON.parse(statusText) : {})?.route?.routes?.find((r: any) => r.routeId === routeId);
    const statistics = routeStatus?.statistics;

    const form = new Intl.NumberFormat('en-US');
    const failed: number = statistics?.exchangesFailed ?? 0;
    const inflight: number = statistics?.exchangesInflight ?? 0;
    const total: number = statistics?.exchangesTotal ?? 0;

    return (
        <foreignObject x={-30} y={-4} width={120} height={70}>
            <div className="node-metric">
                <div className="pf-v6-c-badge metric metric-total total-color" style={{visibility: total > 0 ? 'visible' : 'hidden'}}>{form.format(total)}</div>
                <div className="pf-v6-c-badge metric metric-inflight inflight-color" style={{visibility: inflight > 0 ? 'visible' : 'hidden'}}>{form.format(inflight)}</div>
                <div className="pf-v6-c-badge metric metric-failed failed-color" style={{visibility: failed > 0 ? 'visible' : 'hidden'}}>{form.format(failed)}</div>
            </div>
        </foreignObject>
)
}