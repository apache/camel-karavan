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

import * as React from 'react';
import './TopologyData.css';
import {Button, Card, CardBody, CardTitle, Radio,} from "@patternfly/react-core";
import {useArchitectureStore} from "@stores/ArchitectureStore";
import {CheckCircleIcon} from "@patternfly/react-icons";

export function TopologyData() {

    const exchangeMessage = useArchitectureStore((s) => s.exchangeMessage)
    const selectedVariable = useArchitectureStore((s) => s.selectedVariable)
    const setSelectedVariable = useArchitectureStore((s) => s.setSelectedVariable)
    const setSelectedBean = useArchitectureStore((s) => s.setSelectedBean)

    const card =  (
        <Card isCompact className="topology-data-card">
            <CardTitle>Variables</CardTitle>
            <CardBody className='card-body'>
                {exchangeMessage?.variables.sort((a, b) => a.key.localeCompare(b.key)).map((variable, index) => {
                    const icon = selectedVariable?.key === variable.key ? <CheckCircleIcon color={"var(--platform-color)"}/> : undefined;
                    return (
                        <div key={index} className="topology-data-item">
                            <Button variant='link'
                                    className='data-button'
                                    onClick={() => {}}
                            >
                                {variable.key}
                            </Button>
                            <Radio id={variable.key}
                                   name={variable.key}
                                   aria-label={variable.key}
                                   isChecked={selectedVariable?.key === variable.key}
                                   onClick={_ => {
                                       setSelectedBean(null)
                                       if (selectedVariable?.key !== variable.key) {
                                           setSelectedVariable(variable);
                                       } else {
                                           setSelectedVariable(null);
                                       }
                                   }}
                            />
                        </div>
                    )
                })}
            </CardBody>
        </Card>
    )

    return exchangeMessage?.variables?.length > 0 ? card : null;
}