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
import {Button, Content,} from '@patternfly/react-core';
import './DslSelector.css';
import {CamelUi} from "../utils/CamelUi";
import {DslMetaModel} from "../utils/DslMetaModel";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/outlined-times-circle-icon";

interface Props {
    dsl: DslMetaModel,
    index: number
    onDslSelect: (evt: React.MouseEvent, dsl: DslMetaModel) => void
    onDeleteFast: (evt: React.MouseEvent, dsl: DslMetaModel) => void
}

export function DslFastCard (props: Props) {

    function selectDsl(evt: React.MouseEvent, dsl: DslMetaModel) {
        props.onDslSelect(evt, dsl);
    }

    function deleteFast(evt: React.MouseEvent) {
        props.onDeleteFast(evt, dsl);
    }

    const {dsl, index} = props;

    return (
        <div key={dsl.dsl + index} className="dsl-card dsl-fast-card"
              onClick={event => selectDsl(event, dsl)}>
                {CamelUi.getIconForDsl(dsl)}
                <Content component="p" className='dsl-fast-card-title'>{dsl.title}</Content>
            <div>
                <Button className='fast-delete' variant='plain' icon={<TimesIcon/>} onClick={deleteFast}/>
            </div>
        </div>
    )
}