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

import React, {useEffect, useState} from 'react';
import './ProjectLog.css';
import {Table, Tbody, Td, Th, Thead, Tr} from "@patternfly/react-table";
import {Bullseye, Spinner} from "@patternfly/react-core";
import {KaravanApi} from "@/api/KaravanApi";
import {PodEvent} from "@/api/ProjectModels";

interface Props {
    currentPodName: string
    header?: React.ReactNode
}

export function PodEventsLogTab (props: Props) {

    const [podEvents,setPodEvents ] = useState<PodEvent[]>([]);

    useEffect(() => {
        KaravanApi.getPodEvents(props.currentPodName, pes => setPodEvents(pes));
    }, []);

    return (
        <div style={{display: "flex", flexDirection:"column", position: "relative", height: "100%"}}>
            {props.header}
            {podEvents.length === 0 && <Bullseye height={'100%'}><Spinner></Spinner></Bullseye>}
            {podEvents.length > 0 && <div style={{overflow: "auto"}}>
                <Table aria-label="Simple table" height={"100vh"} variant='compact'>
                    <Thead>
                        <Tr>
                            <Th>ID</Th>
                            <Th>Reason</Th>
                            <Th>Note</Th>
                            <Th>TimeStamp</Th>
                        </Tr>
                    </Thead>
                    <Tbody className='event-table'>
                        {podEvents.map((podEvent) => (
                            <Tr key={podEvent.id}>
                                <Td>{podEvent.id}</Td>
                                <Td>{podEvent.reason}</Td>
                                <Td>{podEvent.note}</Td>
                                <Td>{podEvent.creationTimestamp}</Td>
                            </Tr>
                        ))}
                    </Tbody>
                </Table>
            </div>}
        </div>
    );
}
