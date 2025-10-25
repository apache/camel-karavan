import React, {useEffect} from 'react';
import {Bullseye, EmptyState, Spinner,} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {shallow} from "zustand/shallow";
import {useStatusesStore} from "@/api/ProjectStore";
import {DeploymentStatusRow} from "./DeploymentStatusRow";

export function DeploymentStatusesTable() {

    const [deployments] = useStatusesStore((state) => [state.deployments], shallow);

    useEffect(() => {
    }, []);

    function getTableBody() {
        return (
            deployments.map((deployment, index) => (
                <DeploymentStatusRow key={index} index={index} deployment={deployment}/>
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
                            <Th key='name' modifier={"fitContent"}>Deployment Name</Th>
                            <Th key='id'>Image</Th>
                            <Th key='type' modifier={"fitContent"}>Environment</Th>
                            <Th key='state' modifier={"fitContent"}>Namespace</Th>
                        </Tr>
                    </Thead>
                    {deployments && deployments.length > 0 ? getTableBody() : getTableEmpty()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}
