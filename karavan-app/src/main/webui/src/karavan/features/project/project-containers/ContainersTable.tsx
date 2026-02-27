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

import React from 'react';
import {InnerScrollContainer, OuterScrollContainer, Table, Tbody, Th, Thead, Tr} from "@patternfly/react-table";
import {useSelectedContainerStore} from "@stores/ProjectStore";
import {ProjectContainersContext} from "@features/project/ProjectContainersContextProvider";
import {ContainersTableRow} from "@features/project/project-containers/ContainersTableRow";

export function ContainersTable() {

    const [selectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName]);
    const context = React.useContext(ProjectContainersContext);
    if (!context) throw new Error("ProjectContainersContext not found!");
    const {containerStatuses} = context;

    return (
        <OuterScrollContainer>
            <InnerScrollContainer>
                <Table aria-label="Simple table" height={"100vh"} variant='compact' isStickyHeader>
                    <Thead>
                        <Tr>
                            <Th>Name</Th>
                            <Th>Type</Th>
                            <Th>Created</Th>
                            <Th>Image</Th>
                            <Th>CPU</Th>
                            <Th>Memory</Th>
                        </Tr>
                    </Thead>
                    <Tbody className='event-table'>
                        {containerStatuses.map((containerStatus, index) => (
                            <ContainersTableRow containerStatus={containerStatus} index={index}/>
                        ))}
                    </Tbody>
                </Table>
            </InnerScrollContainer>
        </OuterScrollContainer>
    );
}
