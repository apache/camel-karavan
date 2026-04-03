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
import {Card, CardBody, CardTitle, Label,} from "@patternfly/react-core";
import {getDesignerIcon, OpenApiIcon} from "@features/project/designer/icons/KaravanIcons";

export function TopologyLegend () {

    return (
        <Card isCompact   className="topology-legend-card">
            <CardTitle>Legend</CardTitle>
            <CardBody className='card-body'>
                <Label className='orange' icon={<div style={{display: 'flex'}}>{getDesignerIcon('route')}</div>}>Route</Label>
                <Label className='orange' icon={<div style={{display: 'flex', gap: '6px'}}><OpenApiIcon/></div>}>OpenAPI</Label>
                <Label className='orange' icon={<div style={{display: 'flex'}}>{getDesignerIcon('rest')}</div>}>REST</Label>
                <Label className='orange route-template'>Route Template</Label>
                <Label className='blue'>Component</Label>
                <Label className='green'>Kamelet</Label>
            </CardBody>
        </Card>
    )
}