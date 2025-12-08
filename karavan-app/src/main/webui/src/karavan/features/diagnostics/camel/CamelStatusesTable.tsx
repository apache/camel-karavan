import React, {useEffect} from 'react';
import {Bullseye, EmptyState, Spinner} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {shallow} from "zustand/shallow";
import {useStatusesStore} from "@stores/ProjectStore";
import {CamelStatusRow} from "./CamelStatusRow";

export function CamelStatusesTable() {

    const [camels] = useStatusesStore((state) => [state.camelContexts], shallow);

    useEffect(() => {
    }, []);

    function getTableBody() {
        return (
            camels.map((camel, index) => (
                <CamelStatusRow key={index} index={index} camel={camel}/>
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
                            <Th/>
                            <Th key='name'>Project ID</Th>
                            <Th key='key' modifier={"fitContent"}>Container Name</Th>
                            <Th key='value' modifier={"fitContent"}>Environment</Th>
                        </Tr>
                    </Thead>
                    {camels && camels.length > 0 ? getTableBody() : getTableEmpty()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}
