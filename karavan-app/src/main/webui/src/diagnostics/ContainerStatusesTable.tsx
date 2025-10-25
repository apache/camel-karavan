import React, {useEffect} from 'react';
import {Bullseye, EmptyState, Spinner} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {shallow} from "zustand/shallow";
import {useStatusesStore} from "@/api/ProjectStore";
import {ContainerStatusRow} from "./ContainerStatusRow";

export function ContainerStatusesTable() {

    const [containers] = useStatusesStore((state) => [state.containers], shallow);

    useEffect(() => {
    }, []);

    function getTableBody() {
        return (
            containers.map((container, index) => (
                <ContainerStatusRow key={index} index={index} container={container}/>
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
                            <Th key='name'>Container Name</Th>
                            <Th key='id'>Container Id</Th>
                            <Th key='type'>Type</Th>
                            <Th key='state'>State</Th>
                            <Th key='environment' modifier={"fitContent"}>Environment</Th>
                        </Tr>
                    </Thead>
                    {containers && containers.length > 0 ? getTableBody() : getTableEmpty()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}
