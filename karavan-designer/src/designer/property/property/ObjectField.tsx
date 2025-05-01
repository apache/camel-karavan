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
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {DslPropertyField} from "./DslPropertyField";
import {
    ExpressionDefinition,
} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import { PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {RouteToCreate} from "../../utils/CamelUi";

interface Props {
    property: PropertyMeta,
    onPropertyUpdate: (fieldId: string, value: CamelElement, newRoute?: RouteToCreate) => void
    hideLabel?: boolean
    value?: CamelElement,
    expressionEditor: React.ComponentType<any>
}

const hiddenIdElementDefinitions = ['SetVariableDefinition', 'SetHeaderDefinition', 'ErrorHandlerDefinition', 'DeadLetterChannelDefinition', 'DefaultErrorHandlerDefinition', 'RedeliveryPolicyDefinition'];

export function ObjectField(props: Props) {

    const [value, setValue] = useState<CamelElement | undefined>(props.value);

    function propertyChanged (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) {
        if (props.value) {
            const clone = CamelUtil.cloneStep(props.value);
            (clone as any)[fieldId] = value;
            setStep(clone)
            props.onPropertyUpdate(props.property.name, clone, newRoute);
        }
    }

    function expressionChanged (propertyName: string, value:ExpressionDefinition, newRoute?: RouteToCreate) {
        if (props.value) {
            const clone = CamelUtil.cloneStep(props.value);
            (clone as any)[propertyName] = value;
            setStep(clone)
            props.onPropertyUpdate(props.property.name, clone, newRoute);
        }
    }

    function setStep (step?: CamelElement) {
        setValue(step);
    }

    function sortProperties(p1: PropertyMeta, p2: PropertyMeta): number {
        if (value?.dslName.startsWith('Set') && p1.name === 'name') return -1;
        return 0;
    }

    const val = props.value;
    return (
        <div className="object-field">
            {val && CamelDefinitionApiExt.getElementProperties(val.dslName)
                .sort(sortProperties)
                .filter((p: PropertyMeta) => !(['id', 'description', 'disabled'].includes(p.name) && value?.dslName && hiddenIdElementDefinitions.includes(value?.dslName))) // do not show id
                .map((property: PropertyMeta)  =>
                <DslPropertyField key={property.name}
                                  property={property}
                                  element={value}
                                  onExpressionChange={expressionChanged}
                                  onParameterChange={(parameter, value, pathParameter, newRoute) => propertyChanged(property.name, value, newRoute)}
                                  onDataFormatChange={value1 => {}}
                                  onPropertyChange={(fieldId, value, newRoute) => propertyChanged(property.name, value, newRoute)}
                                  value={val ? (val as any)[property.name] : undefined}
                                  expressionEditor={props.expressionEditor}
                />
            )}
        </div>
    )
}