import React from 'react';
import {Bullseye, EmptyState, EmptyStateBody, EmptyStateVariant, Spinner} from '@patternfly/react-core';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import {useSystemStore} from "../../../stores/SystemStore";
import {shallow} from "zustand/shallow";
import {ConfigMapRow} from "./ConfigMapRow";
import {useAppConfigStore} from "@stores/ProjectStore";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

export function ConfigMapsTable() {

    const [configmaps] = useSystemStore((s) => [s.configmaps], shallow);
    const configmapNames: string[] = [...new Set(configmaps.map(name => name.name))];
    const [info, config] = useAppConfigStore((s) => [s.dockerInfo, s.config])
    const isSupported = config.infrastructure === 'kubernetes' || info?.Nodes > 0;

    function getTableBody() {
        return (
            configmapNames.map((name, index) => (
                <ConfigMapRow key={name} index={index} configmapName={name}/>
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
                                    ConfigMaps are only supported in <b>Kubernetes</b>
                                </EmptyStateBody>
                                <EmptyStateBody>
                                    Configs are only supported in <b style={{textWrap: 'nowrap'}}>Docker Swarm mode</b>
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
                            <Th/>
                            <Th key='name'>Name</Th>
                            <Th key='key'>Key</Th>
                            <Th key='value'>Value</Th>
                            <Th key='action'></Th>
                        </Tr>
                    </Thead>
                    {configmaps && configmaps.length > 0 ? getTableBody() : getTableEmpty()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )
}
