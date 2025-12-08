import React from 'react';
import {Bullseye, EmptyState, Spinner} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {shallow} from "zustand/shallow";
import {AppPropsRow} from "./AppPropsRow";
import {useDiagnosticsStore} from "@models/DiagnosticsStore";

export function AppPropsTable() {

    const [appProps, filter] = useDiagnosticsStore((s) => [s.appProps, s.filter], shallow);

    function getTableBody() {
        return (
            appProps.filter(name => name.toLowerCase().includes(filter.toLowerCase())).map((name, index) => (
                <AppPropsRow key={name} name={name}/>
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
                    {appProps && appProps.length > 0 ? getTableBody() : getTableEmpty()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}
