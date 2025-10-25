import React from 'react';
import {Bullseye, EmptyState, Spinner} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {shallow} from "zustand/shallow";
import {EnvVarRow} from "./EnvVarRow";
import {useDiagnosticsStore} from "@/diagnostics/DiagnosticsStore";

export function EnvVarsTable() {

    const [envVars, filter] = useDiagnosticsStore((s) => [s.envVars, s.filter], shallow);

    function getTableBody() {
        return (
            envVars.filter(name => name.toLowerCase().includes(filter.toLowerCase())).map((name, index) => (
                <EnvVarRow key={name} name={name}/>
            ))
        )
    }

    function getTableEmpty() {
        return (
            <Tr>
                <Td colSpan={15}>
                    <Bullseye>
                        <EmptyState icon={Spinner}/>
                    </Bullseye>
                </Td>
            </Tr>
        )
    }

    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table variant='compact' borders={false} isStickyHeader>
                    <Thead>
                        <Tr>
                            <Th key='name'>Name</Th>
                            <Th key='value'>Value</Th>
                            <Th key='action'></Th>
                        </Tr>
                    </Thead>
                    {envVars && envVars.length > 0 ? getTableBody() : getTableEmpty()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}
