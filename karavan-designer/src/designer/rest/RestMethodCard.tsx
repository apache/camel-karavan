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
import {Button} from '@patternfly/react-core';
import '../karavan.css';
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {useDesignerStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {DeleteElementIcon} from "../utils/ElementIcons";
import {InfrastructureAPI} from "../utils/InfrastructureAPI";

interface Props<T extends CamelElement> {
    method: T
    selectElement: (element: CamelElement) => void
    deleteElement: (element: CamelElement) => void
}

export function RestMethodCard<T extends CamelElement> (props: Props<T>) {

    const [selectedStep] = useDesignerStore((s) => [s.selectedStep], shallow)

    function selectElement (evt: React.MouseEvent) {
        evt.stopPropagation();
        props.selectElement(props.method);
    }

    function onDelete (evt: React.MouseEvent) {
        evt.stopPropagation();
        props.deleteElement(props.method);
    }

    function onInternalConsumerClick (evt: React.MouseEvent) {
        try {
            evt.stopPropagation();
            const split = method?.to?.split(':');
            InfrastructureAPI.onInternalConsumerClick(split[0], split[1], undefined);
        } catch (e) {
            console.error(e);
        }
    }

    const method: any = props.method;
    return (
        <div className={selectedStep?.uuid === method.uuid ? "method-card method-card-selected" : "method-card method-card-unselected"} onClick={e => selectElement(e)}>
            <div className="method">{method.dslName.replace('Definition', '').toUpperCase()}</div>
            <div className="rest-method-desc">
                <div className="title">/{method.path}</div>
                <div className="description">{method.description}</div>
            </div>
            <Button variant="link" className="internal-consumer-button" onClick={e => onInternalConsumerClick(e)}>{method?.to}</Button>
            <Button variant="link" className="delete-button" onClick={e => onDelete(e)}>{DeleteElementIcon()}</Button>
        </div>
    )
}