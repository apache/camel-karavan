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
import {
    Form,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {DslPropertyField} from "../route/property/DslPropertyField";
import {
    ExpressionDefinition,
    DataFormatDefinition
} from "karavan-core/lib/model/CamelDefinition";
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelUi, RouteToCreate} from "../utils/CamelUi";
import {CamelMetadataApi, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    integration: Integration,
    step?: CamelElement,
    onIntegrationUpdate?: any,
    onPropertyUpdate?: (element: CamelElement, updatedUuid: string, newRoute?: RouteToCreate) => void
}

interface State {
    step?: CamelElement,
    selectStatus: Map<string, boolean>
}

export class RestProperties extends React.Component<Props, State> {

    public state: State = {
        step: this.props.step,
        selectStatus: new Map<string, boolean>(),
    };

    propertyChanged = (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) => {
        if (this.state.step) {
            const clone = CamelUtil.cloneStep(this.state.step);
            (clone as any)[fieldId] = value;
            this.setStep(clone)
            this.props.onPropertyUpdate?.call(this, clone, this.state.step.uuid, newRoute);
        }
    }

    dataFormatChanged = (value: DataFormatDefinition) => {
        value.uuid = this.state.step?.uuid ? this.state.step?.uuid : value.uuid;
        this.setStep(value);
        this.props.onPropertyUpdate?.call(this, value, value.uuid);
    }

    expressionChanged = (propertyName: string, exp:ExpressionDefinition) => {
        if (this.state.step) {
            const clone = (CamelUtil.cloneStep(this.state.step));
            (clone as any)[propertyName] = exp;
            this.setStep(clone);
            this.props.onPropertyUpdate?.call(this, clone, this.state.step.uuid);
        }
    }

    parametersChanged = (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => {
        if (this.state.step && this.state.step) {
            if (pathParameter) {
                const uri = ComponentApi.buildComponentUri((this.state.step as any).uri, parameter, value);
                this.propertyChanged("uri", uri, newRoute);
            } else {
                const clone = (CamelUtil.cloneStep(this.state.step));
                const parameters: any = {...(clone as any).parameters};
                parameters[parameter] = value;
                (clone as any).parameters = parameters;
                this.setStep(clone);
                this.props.onPropertyUpdate?.call(this, clone, this.state.step.uuid);
            }
        }
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevProps.step !== this.props.step) {
            this.setStep(this.props.step);
        }
    }

    setStep = (step?: CamelElement) => {
        this.setState({
            step: step,
            selectStatus: new Map<string, boolean>()
        });
    }

    getProps = (): PropertyMeta[] => {
        const dslName = this.state.step?.dslName;
        return CamelDefinitionApiExt.getElementProperties(dslName)
            .filter(p => !p.isObject || (p.isObject && !CamelUi.dslHasSteps(p.type)))
            .filter(p => ['consumes', 'produces', 'enableCors'].includes(p.name));
    }

    render() {
        return (
            <div key={this.state.step ? this.state.step.uuid : 'integration'} className='properties'>
                <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                    {this.getProps().map((property: PropertyMeta) =>
                        <DslPropertyField key={property.name}
                                          integration={this.props.integration}
                                          property={property}
                                          element={this.state.step}
                                          value={this.state.step ? (this.state.step as any)[property.name] : undefined}
                                          onExpressionChange={this.expressionChanged}
                                          onParameterChange={this.parametersChanged}
                                          onDataFormatChange={this.dataFormatChanged}
                                          onChange={this.propertyChanged} />
                    )}
                </Form>
            </div>
        )
    }
}