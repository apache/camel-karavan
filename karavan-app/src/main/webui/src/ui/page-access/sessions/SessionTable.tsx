import React, {useState} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant, Spinner} from '@patternfly/react-core';
import '../AccessPage.css';
import {InnerScrollContainer, OuterScrollContainer, Table, TableVariant, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {SearchIcon} from "@patternfly/react-icons";
import {shallow} from "zustand/shallow";
import {useAccessStore} from "@stores/AccessStore";
import {SessionInfo} from "@models/AccessModels";
import {SessionTableRow} from "./SessionTableRow";

export function SessionTable() {

    const [sessions, filter] = useAccessStore((s) => [s.sessions, s.filter], shallow);
    const [loading] = useState<boolean>(true);

    function getEmptyState() {
        return (
            <Tbody>
                <Tr>
                    <Td colSpan={8}>
                        <Bullseye>
                            {loading && <Spinner className="progress-stepper" diameter="80px" aria-label="Loading..."/>}
                            {!loading &&
                                <EmptyState variant={EmptyStateVariant.sm} titleText="No results found" icon={SearchIcon} headingLevel="h2"/>
                            }
                        </Bullseye>
                    </Td>
                </Tr>
            </Tbody>
        )
    }

    const conts = sessions.filter(session => session.username?.toLowerCase().includes(filter)
    ).sort((a, b) => a.username.localeCompare(b.username));
    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table aria-label="Projects" variant={TableVariant.compact} isStickyHeader>
                    <Thead>
                        <Tr>
                            <Th key='name'>Name</Th>
                            <Th key='created'>Created At</Th>
                            <Th key='expired'>Expired At</Th>
                            <Th key='action' screenReaderText='pass'></Th>
                        </Tr>
                    </Thead>
                    {conts?.map((session: SessionInfo, index: number) => (
                        <SessionTableRow key={session.username + "-" + index} index={index} session={session}/>
                    ))}
                    {conts?.length === 0 && getEmptyState()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )

}