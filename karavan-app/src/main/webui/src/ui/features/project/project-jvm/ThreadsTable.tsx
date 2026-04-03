import React from 'react';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {useProjectStore, useSelectedContainerStore} from "@stores/ProjectStore";

export function ThreadsTable() {

    const [selectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName]);
    const camelStatuses = useProjectStore((state) => state.camelStatuses);
    const thread = camelStatuses.filter(cs => cs.containerName === selectedContainerName)?.at(0)
        ?.statuses.find(s => s.name === 'thread');
    const statusText = thread?.status;
    const status = statusText !== undefined ? JSON.parse(statusText) : {};
    const threads = status?.thread?.threads;
    const show = threads !== undefined && Array.isArray(threads);

    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table aria-label="App configuration table" height={"100vh"} variant='compact'>
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
                            {show && threads.map((t: any) => {
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
            </InnerScrollContainer>
        </OuterScrollContainer>
    );
}
