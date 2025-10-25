import React from 'react';
import './ProjectLog.css';
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {useAppConfigStore, useProjectStore} from "@/api/ProjectStore";
import {Bullseye, Button, Label, Spinner, Tooltip} from "@patternfly/react-core";
import TimeAgo from "javascript-time-ago";
import {PauseIcon, PlayIcon, StopIcon} from "@patternfly/react-icons";
import {RuntimeApi} from "@/runtime/RuntimeApi";

interface Props {
    currentPodName: string
    header?: React.ReactNode
}

export function RoutesTab(props: Props) {

    const config = useAppConfigStore((state) => state.config);
    const project = useProjectStore((state) => state.project);
    const camelStatuses = useProjectStore((state) => state.camelStatuses);
    const route = camelStatuses[0]?.statuses.find(s => s.name === 'route');
    const statusText = route?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const routes = status?.route?.routes;
    const show = routes !== undefined && Array.isArray(routes);
    const timeAgo = new TimeAgo('en-US')


    function execRouteAction(routeId: string, action: string) {
        RuntimeApi.getRuntimeRouteAction(project.projectId, config.environment, routeId, action, res => {

        })
    }

    return (
        <div style={{display: "flex", flexDirection: "column", position: "relative", height: "100%", backgroundColor: "var(--pf-t--global--background--color--primary--default)"}}>
            {props.header}
            {!show && <Bullseye height={'100%'}><Spinner></Spinner></Bullseye>}
            {show &&
                <div style={{overflow: "auto"}}>
                    <Table aria-label="Main configuration table" height={"100vh"} variant='compact'>
                        <Thead>
                            <Tr>
                                <Th modifier='nowrap'>RouteId</Th>
                                <Th modifier='nowrap'>Description</Th>
                                <Th modifier='nowrap'>State</Th>
                                <Th modifier='nowrap'>Uptime</Th>
                                <Th modifier='nowrap'>From</Th>
                                <Th modifier='nowrap'>Exchanges Total</Th>
                                <Th modifier='nowrap'>Exchanges Inflight</Th>
                                <Th modifier='nowrap'>Exchanges Failed</Th>
                                <Th modifier='nowrap'>Last Failed</Th>
                                <Th textCenter>Actions</Th>
                            </Tr>
                        </Thead>
                        <Tbody className='route-table'>
                            {routes.map((t) => {
                                const time = t.statistics.lastFailedExchangeTimestamp;
                                const dateString = time ? new Date(time).toISOString() : undefined;
                                const date = time ? timeAgo.format(new Date(time), 'mini-now') : undefined;
                                const failedGap = Date.now() - (time ?? 0);
                                const failedColor = failedGap < 30000 ? 'red' : 'grey'
                                const isStoppable = ['Started', 'Suspended'].includes(t.state);
                                const isSuspendable = t.state === 'Started';
                                const isStartable = t.state === 'Stopped';
                                const isResumable = t.state === 'Suspended';
                                const colorDanger = 'var(--pf-t--global--icon--color--status--danger--default)';
                                const colorWarning = 'var(--pf-t--global--icon--color--status--warning--default)';
                                const colorNormal = 'var(--pf-t--global--color--brand--default)';
                                const colorState = t.state === 'Started' ? 'green' : (t.state === 'Stopped' ? 'red' : 'yellow');
                                return (
                                    <Tr key={t.routeId} style={{verticalAlign: "middle"}}>
                                        <Td>{t.routeId}</Td>
                                        <Td>{t.description}</Td>
                                        <Td><Label color={colorState}>{t.state}</Label></Td>
                                        <Td>{t.uptime}</Td>
                                        <Td>{t.from}</Td>
                                        <Td>{t.statistics.exchangesTotal}</Td>
                                        <Td>{t.statistics.exchangesInflight}</Td>
                                        <Td>{t.statistics.exchangesFailed}</Td>
                                        <Td> {date &&
                                            <Tooltip content={dateString} position={'left'}>
                                                <Label color={failedColor}>{`${date} ago`}</Label>
                                            </Tooltip>
                                        }
                                        </Td>
                                        <Td style={{paddingInlineEnd: '0.5rem'}}>
                                            <div style={{display: "flex", flexDirection: "row", justifyContent: "space-between", width: "fit-content"}}>
                                                {isSuspendable && <Button variant={'plain'} icon={<PauseIcon color={colorWarning}/>}
                                                                          onClick={_ => execRouteAction(t.routeId, "suspend")}/>}
                                                {isResumable && <Button variant={'plain'} icon={<PlayIcon color={colorNormal}/>}
                                                                        onClick={_ => execRouteAction(t.routeId, "resume")}/>}
                                                {isStoppable && <Button variant={'plain'} icon={<StopIcon color={colorDanger}/>}
                                                                        onClick={_ => execRouteAction(t.routeId, "stop")}/>}
                                                {isStartable && <Button variant={'plain'} icon={<PlayIcon color={colorNormal}/>}
                                                                        onClick={_ => execRouteAction(t.routeId, "start")}/>}
                                            </div>
                                        </Td>
                                    </Tr>
                                )
                            })}
                        </Tbody>
                    </Table>
                </div>
            }
        </div>
    );
}
