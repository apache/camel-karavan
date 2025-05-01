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
import './TopologyLegend.css';
import {
    Badge,
    Card,
    CardBody,
    CardTitle,
    Label,
} from "@patternfly/react-core";
import {COLOR_BLUE, COLOR_GREEN, COLOR_ORANGE} from "./CustomNode";

export function TopologyLegend () {


    return (
        <Card isCompact isFlat isRounded className="topology-legend-card">
            <CardTitle>Legend</CardTitle>
            <CardBody className='card-body'>
                <Label className='orange' icon={<Badge style={{backgroundColor: COLOR_ORANGE, padding: 0}}>API</Badge>}>REST</Label>
                <Label className='orange'>Route</Label>
                <Label className='orange route-template'>Route Template</Label>
                <Label className='blue'>Component</Label>
                <Label className='green'>Kamelet</Label>
            </CardBody>
        </Card>
    )
}