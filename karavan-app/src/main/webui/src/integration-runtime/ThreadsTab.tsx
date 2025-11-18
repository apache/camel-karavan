import React from 'react';
import './ProjectLog.css';
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {useProjectStore} from "@/api/ProjectStore";
import {Bullseye, Spinner} from "@patternfly/react-core";

interface Props {
    currentPodName: string
    header?: React.ReactNode
}

export function ThreadsTab (props: Props) {

    const camelStatuses = useProjectStore((state) => state.camelStatuses);
    const thread = camelStatuses[0]?.statuses.find(s => s.name === 'thread');
    const statusText = thread?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const threads = status?.thread?.threads;
    const show = threads !== undefined && Array.isArray(threads);

    return (
        <div style={{display: "flex", flexDirection:"column", position: "relative", height: "100%", backgroundColor: "var(--pf-t--global--background--color--primary--default)"}}>
            {props.header}
            {!show  && <Bullseye height={'100%'}><Spinner></Spinner></Bullseye>}
            {show &&
                <div style={{overflow: "auto"}}>
                    <Table aria-label="Main configuration table" height={"100vh"} variant='compact'>
                        <Thead>
                            <Tr>
                                <Th modifier='nowrap'>Id</Th>
                                <Th modifier='nowrap'>Name</Th>
                                <Th modifier='nowrap'>State</Th>
                                <Th modifier='nowrap'>Blocked Count</Th>
                                <Th modifier='nowrap'>Blocked Time</Th>
                                <Th modifier='nowrap'>Lock Name</Th>
                                <Th modifier='nowrap'>Waited Count</Th>
                                <Th modifier='nowrap'>Waited Time</Th>
                            </Tr>
                        </Thead>
                        <Tbody className='event-table'>
                            {threads.map((t) => {
                                return (
                                    <Tr key={t.id}>
                                        <Td>{t.id}</Td>
                                        <Td>{t.name}</Td>
                                        <Td>{t.state}</Td>
                                        <Td>{t.blockedCount}</Td>
                                        <Td>{t.blockedTime}</Td>
                                        <Td>{t.lockName}</Td>
                                        <Td>{t.waitedCount}</Td>
                                        <Td>{t.waitedTime}</Td>
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
