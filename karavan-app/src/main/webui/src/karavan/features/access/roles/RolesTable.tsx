/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, {useState} from 'react';
import {Bullseye, EmptyState, EmptyStateVariant, Spinner} from '@patternfly/react-core';
import '../AccessPage.css';
import {InnerScrollContainer, OuterScrollContainer, Table, TableVariant, Tbody, Td, Th, Thead, Tr} from '@patternfly/react-table';
import SearchIcon from "@patternfly/react-icons/dist/esm/icons/search-icon";
import {shallow} from "zustand/shallow";
import {useAccessStore} from "../../../stores/AccessStore";
import {AccessRole} from "../../../models/AccessModels";
import {RolesTableRow} from "@features/access/roles/RolesTableRow";

export function RolesTable() {

    const [roles, filter] = useAccessStore((s) => [s.roles, s.filter], shallow);
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

    const conts = roles.filter(role =>
        role.name?.toLowerCase().includes(filter)
        || role.name?.toLowerCase().includes(filter)
        || role.name?.toLowerCase().includes(filter)
    ).sort((a, b) => a.name.localeCompare(b.name));
    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table aria-label="Projects" variant={TableVariant.compact} isStickyHeader>
                    <Thead>
                        <Tr>
                            <Th key='type' modifier={'fitContent'}>Type</Th>
                            <Th key='name'>Name</Th>
                            <Th key='decription'>Description</Th>
                            <Th key='users'>Users</Th>
                            <Th key='action' screenReaderText='pass'></Th>
                        </Tr>
                    </Thead>
                    {conts?.map((role: AccessRole, index: number) => (
                        <RolesTableRow key={role.name} index={index} role={role}/>
                    ))}
                    {conts?.length === 0 && getEmptyState()}
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    )

}