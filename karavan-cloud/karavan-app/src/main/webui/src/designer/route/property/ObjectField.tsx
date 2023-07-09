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
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {DslPropertyField} from "./DslPropertyField";
import {
    ExpressionDefinition,
} from "karavan-core/lib/model/CamelDefinition";
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import { PropertyMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    property: PropertyMeta,
    value?: CamelElement,
    onPropertyUpdate?: (fieldId: string, value: CamelElement) => void
    integration: Integration,
    hideLabel?: boolean
    dark: boolean
}

interface State {
    value?: CamelElement,
    selectStatus: Map<string, boolean>
}

export class ObjectField extends React.Component<Props, State> {
    public state: State = {
        value: this.props.value,
        selectStatus: new Map<string, boolean>(),
    };

    propertyChanged = (fieldId: string, value: string | number | boolean | any) => {
        if (this.props.value) {
            const clone = CamelUtil.cloneStep(this.props.value);
            (clone as any)[fieldId] = value;
            this.setStep(clone)
            this.props.onPropertyUpdate?.call(this, this.props.property.name, clone);
        }
    }

    expressionChanged = (propertyName: string, value:ExpressionDefinition) => {
        if (this.props.value) {
            const clone = CamelUtil.cloneStep(this.props.value);
            (clone as any)[propertyName] = value;
            this.setStep(clone)
            this.props.onPropertyUpdate?.call(this, this.props.property.name, clone);
        }
    }

    setStep = (step?: CamelElement) => {
        this.setState({
            value: step,
            selectStatus: new Map<string, boolean>()
        });
    }

    render() {
        const value = this.props.value;
        return (
                <div className="object-field">
                    {value && CamelDefinitionApiExt.getElementProperties(value.dslName).map((property: PropertyMeta)  =>
                        <DslPropertyField key={property.name}
                                          hideLabel={this.props.hideLabel}
                                          integration={this.props.integration}
                                          property={property}
                                          element={value}
                                          value={value ? (value as any)[property.name] : undefined}
                                          onExpressionChange={this.expressionChanged}
                                          onParameterChange={(parameter, value) => this.propertyChanged(property.name, value)}
                                          onDataFormatChange={value1 => {}}
                                          onChange={(fieldId, value) => this.propertyChanged(property.name, value)}
                                          dark={this.props.dark}/>
                    )}
                </div>
        )
    }
}