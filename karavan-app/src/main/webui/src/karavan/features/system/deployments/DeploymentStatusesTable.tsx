import React, {useEffect} from 'react';
import {Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant, Spinner,} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {shallow} from "zustand/shallow";
import {useAppConfigStore, useStatusesStore} from "@stores/ProjectStore";
import {DeploymentStatusRow} from "./DeploymentStatusRow";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

export function DeploymentStatusesTable() {

    const [deployments] = useStatusesStore((state) => [state.deployments], shallow);
    const [config] = useAppConfigStore((s) => [s.config])
    const isSupported = config.infrastructure === 'kubernetes';

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
            <Tbody>
                <Tr>
                    <Td colSpan={15}>
                        <Bullseye>
                            {isSupported
                                ? <EmptyState icon={Spinner}/>
                                : <EmptyState titleText="Not supported"
                                              icon={ExclamationCircleIcon}
                                              headingLevel="h2"
                                              variant={EmptyStateVariant.sm}>
                                    <EmptyStateBody>
                                        Deployments are only supported in <b>Kubernetes</b>
                                    </EmptyStateBody>
                                </EmptyState>
                            }
                        </Bullseye>
                    </Td>
                </Tr>
            </Tbody>
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
