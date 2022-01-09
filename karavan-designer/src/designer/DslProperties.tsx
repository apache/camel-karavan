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
    FormGroup,
    TextInput,
    Text,
    Title,
    TextVariants,
} from '@patternfly/react-core';
import './karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {CamelElement, Expression, Integration} from "karavan-core/lib/model/CamelModel";
import {CamelApi} from "karavan-core/lib/api/CamelApi";
import {CamelApiExt} from "karavan-core/lib/api/CamelApiExt";
import {CamelMetadataApi, PropertyMeta} from "karavan-core/lib/api/CamelMetadata";
import {CamelYaml} from "karavan-core/lib/api/CamelYaml";
import {CamelUi} from "karavan-core/lib/api/CamelUi";
import {ComponentApi} from "karavan-core/lib/api/ComponentApi";
import {DataFormatField} from "./field/DataFormatField";
import {DslPropertyField} from "./field/DslPropertyField";
import {DataFormat} from "karavan-core/lib/model/CamelDataFormat";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";

interface Props {
    integration: Integration,
    step?: CamelElement,
    onIntegrationUpdate?: any,
    onPropertyUpdate?: any,
    onChangeView: any
}

interface State {
    integration: Integration,
    step?: CamelElement,
    selectStatus: Map<string, boolean>
    isShowAdvanced: boolean
}

export class DslProperties extends React.Component<Props, State> {

    public state: State = {
        step: this.props.step,
        integration: this.props.integration,
        selectStatus: new Map<string, boolean>(),
        isShowAdvanced: false
    };

    setView = (view: string) => {
        this.props.onChangeView.call(this, view);
    }

    propertyChanged = (fieldId: string, value: string | number | boolean | any) => {
        if (this.state.step) {
            const clone = CamelUtil.cloneStep(this.state.step);
            (clone as any)[fieldId] = value;
            this.setStep(clone)
            this.props.onPropertyUpdate?.call(this, clone, this.state.step.uuid);
        }
    }

    dataFormatChanged = (dataFormat: string, value?: DataFormat) => {
        if (this.state.step && this.state.step){
            if (this.state.step?.dslName === 'unmarshal') {
                const e:any = {unmarshal: {}};
                e.unmarshal[dataFormat] = value ? value : {};
                const unmarshal = CamelApi.createUnmarshal(e);
                unmarshal.uuid = this.state.step.uuid;
                this.setStep(unmarshal);
                this.props.onPropertyUpdate?.call(this, unmarshal, this.state.step.uuid);
            } else {
                const e:any = {marshal: {}};
                e.marshal[dataFormat] = value ? value : {};
                const marshal = CamelApi.createMarshal(e);
                marshal.uuid = this.state.step.uuid;
                this.setStep(marshal);
                this.props.onPropertyUpdate?.call(this, marshal, this.state.step.uuid);
            }
        }
    }

    expressionChanged = (language: string, value: string | undefined) => {
        if (this.state.step) {
            const clone = (CamelUtil.cloneStep(this.state.step));
            const e: any = {};
            e.language = language;
            e[language] = value;
            const exp: any = new Expression(e);
            (clone as any).expression = exp;
            this.setStep(clone);
            this.props.onPropertyUpdate?.call(this, clone, this.state.step.uuid);
        }
    }

    parametersChanged = (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => {
        if (this.state.step && this.state.step) {
            if (pathParameter) {
                const uri = ComponentApi.buildComponentUri((this.state.step as any).uri, parameter, value);
                this.propertyChanged("uri", uri);
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

    getIntegrationHeader = (): JSX.Element => {
        return (
            <div className="headers">
                <Title headingLevel="h1" size="md">Integration</Title>
                <FormGroup label="Title" fieldId="title" isRequired>
                    <TextInput className="text-field" type="text" id="title" name="title" isReadOnly
                               value={
                                   CamelUi.titleFromName(this.state.integration.metadata.name)
                               }/>
                </FormGroup>
                <FormGroup label="Name" fieldId="name" isRequired>
                    <TextInput className="text-field" type="text" id="name" name="name" isReadOnly
                               value={this.state.integration.metadata.name}/>
                </FormGroup>
            </div>
        )
    }

    getComponentHeader = (): JSX.Element => {
        const title = this.state.step && CamelUi.getTitle(this.state.step)
        const kamelet = this.state.step && CamelUi.getKamelet(this.state.step)
        const description = this.state.step && kamelet
            ? kamelet.spec.definition.description
            : this.state.step?.dslName ? CamelMetadataApi.getCamelModelMetadata(this.state.step?.dslName)?.description : title;
        return (
            <div className="headers">
                <Title headingLevel="h1" size="md">{title}</Title>
                <Text component={TextVariants.p}>{description}</Text>
            </div>
        )
    }

    render() {
        return (
            <div key={this.state.step ? this.state.step.uuid : 'integration'} className='properties'>
                <Form autoComplete="off">
                    {this.state.step === undefined && this.getIntegrationHeader()}
                    {this.state.step && this.getComponentHeader()}
                    {this.state.step && CamelApiExt.getElementProperties(this.state.step.dslName).map((property: PropertyMeta) =>
                        <DslPropertyField property={property}
                                          element={this.state.step}
                                          value={this.state.step ? (this.state.step as any)[property.name] : undefined}
                                          onExpressionChange={this.expressionChanged}
                                          onParameterChange={this.parametersChanged}
                                          onDataFormatChange={this.dataFormatChanged}
                                          onChange={this.propertyChanged} />
                    )}
                    {this.state.step && ['marshal', 'unmarshal'].includes(this.state.step.dslName) &&
                        <DataFormatField
                            element={this.state.step}
                            onDataFormatChange={this.dataFormatChanged} />
                    }
                </Form>
            </div>
        )
    }
}