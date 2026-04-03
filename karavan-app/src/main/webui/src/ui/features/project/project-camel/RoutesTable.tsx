import React from 'react';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {useAppConfigStore, useProjectStore} from "@stores/ProjectStore";
import {Button, Content, HelperText, Label, Tooltip} from "@patternfly/react-core";
import TimeAgo from "javascript-time-ago";
import {PauseIcon, PlayIcon, StopIcon} from "@patternfly/react-icons";
import {RuntimeApi} from "@features/project/project-camel/RuntimeApi";

export function RoutesTable() {

    const config = useAppConfigStore((state) => state.config);
    const project = useProjectStore((state) => state.project);
    const camelStatuses = useProjectStore((state) => state.camelStatuses);
    const route = camelStatuses[0]?.statuses.find(s => s.name === 'route');
    const statusText = route?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const routes = status?.route?.routes;
    const show = routes !== undefined && Array.isArray(routes);
    const timeAgo = new TimeAgo('en-US')
    const form = new Intl.NumberFormat('en-US');

    function execRouteAction(routeId: string, action: string) {
        RuntimeApi.getRuntimeRouteAction(project.projectId, config.environment, routeId, action, res => {

        })
    }

    function getCellRight(val: any, border?: boolean) {
        return (<Td modifier={'fitContent'} style={{textAlign: "right"}} hasRightBorder={border}>{val}</Td>)
    }

    function getCellCenter(val: any) {
        return (<Td modifier={'fitContent'} textCenter>{val}</Td>)
    }

    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table aria-label="App configuration table" height={"100vh"} variant='compact' isStickyHeader>
                    <Thead hasNestedHeader>
                        <Tr>
                            <Th colSpan={3} hasRightBorder style={{textAlign: "center"}}>Route</Th>
                            <Th colSpan={6} hasRightBorder style={{textAlign: "center"}}>Exchanges</Th>
                            <Th colSpan={4} hasRightBorder style={{textAlign: "center"}}>Processing Time (ms)</Th>
                            <Th textCenter>Actions</Th>
                        </Tr>
                        <Tr>
                            <Th screenReaderText="" isSubheader modifier="nowrap">RouteId</Th>
                            <Th screenReaderText="" isSubheader modifier="nowrap" style={{textAlign: "right"}}>State</Th>
                            <Th screenReaderText="" isSubheader modifier="nowrap" style={{textAlign: "right"}} hasRightBorder>Uptime</Th>

                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Total</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Succeed</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Failed</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Inflight</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Last Created</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" hasRightBorder style={{textAlign: "right"}}>Last Failed</Th>

                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Min</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Mean</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" style={{textAlign: "right"}}>Max</Th>
                            <Th screenReaderText="" isSubheader modifier="fitContent" hasRightBorder style={{textAlign: "right"}}>Last</Th>


                            <Th textCenter screenReaderText='pass'/>
                        </Tr>
                    </Thead>
                    <Tbody>
                        {show && routes.map((t: any) => {
                            const statistics = t.statistics
                            const time = statistics.lastFailedExchangeTimestamp;
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

                            const maxProcessingTime: number = statistics?.maxProcessingTime || 0;
                            const meanProcessingTime: number = statistics?.meanProcessingTime || 0;
                            const minProcessingTime: number = statistics?.minProcessingTime || 0;
                            const lastProcessingTime: number = statistics?.lastProcessingTime || 0;

                            const exchangesTotal: number = statistics?.exchangesTotal || 0;
                            const exchangesFailed: number = statistics?.exchangesFailed || 0;
                            const exchangesSucceeded: number = exchangesTotal - exchangesFailed;
                            const exchangesInflight: number = statistics?.exchangesInflight || 0;

                            const lastCreated = statistics?.lastCreatedExchangeTimestamp;
                            const lastCreatedString = lastCreated ? new Date(lastCreated).toISOString() : undefined;
                            const lastCreatedTime = lastCreated ? timeAgo.format(new Date(lastCreated), 'mini-now') : undefined;
                            const createdGap = Date.now() - (lastCreated ?? 0);
                            const createdColor = createdGap < 30000 ? 'blue' : 'grey'

                            const lastFailed = statistics?.lastFailedExchangeTimestamp;
                            const lastFailedString = lastFailed ? new Date(lastFailed).toISOString() : undefined;
                            const lastFailedTime = lastFailed ? timeAgo.format(new Date(lastFailed), 'mini-now') : undefined;

                            return (
                                <Tr key={t.routeId} style={{verticalAlign: "middle"}}>
                                    <Td modifier='fitContent'>
                                        <div style={{display: "flex", flexDirection: "column"}}>
                                            <Content component='p' style={{fontWeight: 'normal'}}>{t.routeId}</Content>
                                            <HelperText>{t.description}</HelperText>
                                            <HelperText>{t.from}</HelperText>
                                        </div>
                                    </Td>
                                    {getCellRight(<Label color={colorState}>{t.state}</Label>)}
                                    {getCellRight(t.uptime, true)}
                                    {getCellRight(form.format(exchangesTotal))}
                                    {getCellRight(form.format(exchangesSucceeded))}
                                    {getCellRight(form.format(exchangesFailed))}
                                    {getCellRight(form.format(exchangesInflight))}
                                    {getCellRight(
                                        lastCreated
                                            ? <Tooltip content={lastCreatedString} position='left'>
                                                <Label className={'elabel'} color={createdColor}>{`${lastCreatedTime} ago`}</Label>
                                            </Tooltip>
                                            : <></>
                                    )}
                                    {getCellRight(
                                        date
                                            ? <Tooltip content={lastFailedString} position='left'>
                                                <Label className={'elabel'} color={failedColor}>{`${lastFailedTime} ago`}</Label>
                                            </Tooltip>
                                            : <></>
                                        , true)}
                                    {getCellRight(form.format(minProcessingTime))}
                                    {getCellRight(form.format(meanProcessingTime))}
                                    {getCellRight(form.format(maxProcessingTime))}
                                    {getCellRight(form.format(lastProcessingTime), true)}
                                    <Td style={{paddingInlineEnd: '0.5rem'}} modifier='fitContent'>
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
            </InnerScrollContainer>
        </OuterScrollContainer>
    );
}
