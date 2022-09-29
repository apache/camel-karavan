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
    Select,
    SelectVariant,
    SelectDirection,
    SelectOption, ExpandableSection,
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import {CamelMetadataApi, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {DataFormatDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslPropertyField} from "./DslPropertyField";
import {DataFormats} from "karavan-core/lib/model/CamelMetadata";

interface Props {
    dslName: string,
    value: CamelElement,
    onDataFormatChange?: (value: DataFormatDefinition) => void
    integration: Integration,
    dark: boolean,
}

interface State {
    selectIsOpen: boolean
    dataFormat: string
    isShowAdvanced: boolean
}

export class DataFormatField extends React.Component<Props, State> {

    public state: State = {
        selectIsOpen: false,
        dataFormat: CamelDefinitionApiExt.getDataFormat(this.props.value)?.name || "json",
        isShowAdvanced: false
    }

    componentDidMount() {
        if (CamelDefinitionApiExt.getDataFormat(this.props.value)?.name === undefined) {
            this.dataFormatChanged("json", CamelDefinitionApi.createDataFormat('JsonDataFormat', {}));
        }
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        const newDataFormat = CamelDefinitionApiExt.getDataFormat(this.props.value)?.name || "json"
        if (prevProps.value
            && (prevProps.value.uuid !== this.props.value.uuid
                || prevState.dataFormat !== newDataFormat)
        ) {
            this.setState({
                dataFormat: newDataFormat
            });
        }
    }

    openSelect = () => {
        this.setState({selectIsOpen: true});
    }

    dataFormatChanged = (dataFormat: string, value?: CamelElement) => {
        if (dataFormat !== (value as any).dataFormatName) {
            const className = CamelMetadataApi.getCamelDataFormatMetadataByName(dataFormat)?.className;
            value = CamelDefinitionApi.createDataFormat(className || '', {}); // perhaps copy other similar fields later
        }
        const df = CamelDefinitionApi.createStep(this.props.dslName, {});
        (df as any)[dataFormat] = value;
        this.props.onDataFormatChange?.call(this, df);
        this.setState({selectIsOpen: false});
    }

    propertyChanged = (fieldId: string, value: string | number | boolean | any) => {
        const df = this.getDataFormatValue();
        if (df) {
            (df as any)[fieldId] = value;
            this.dataFormatChanged(this.state.dataFormat, df);
        }
    }

    getDataFormatValue = (): CamelElement => {
        return (this.props.value as any)[this.state.dataFormat]
            ? (this.props.value as any)[this.state.dataFormat]
            : CamelDefinitionApi.createDataFormat(this.state.dataFormat, (this.props.value as any)[this.state.dataFormat]);
    }

    getPropertyFields = (value: any, properties: PropertyMeta[]) => {
        return (<>
            {value && properties?.map((property: PropertyMeta) =>
                <DslPropertyField key={property.name} property={property}
                                  integration={this.props.integration}
                                  element={value}
                                  value={value ? (value as any)[property.name] : undefined}
                                  onExpressionChange={exp => {
                                  }}
                                  onParameterChange={parameter => {
                                      console.log(parameter)
                                  }}
                                  onDataFormatChange={dataFormat => {
                                      console.log(dataFormat)
                                  }}
                                  dark={this.props.dark}
                                  onChange={this.propertyChanged}/>
            )}
        </>)
    }

    render() {
        const value = this.getDataFormatValue();
        const dataFormat = DataFormats.find((l: [string, string, string]) => l[0] === this.state.dataFormat);
        const properties = CamelDefinitionApiExt.getElementPropertiesByName(this.state.dataFormat).sort((a, b) => a.name === 'library' ? -1 : 1);
        const propertiesMain = properties.filter(p => !p.label.includes("advanced"));
        const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));
        const selectOptions: JSX.Element[] = []
        DataFormats.forEach((lang: [string, string, string]) => {
            const s = <SelectOption key={lang[0]} value={lang[0]} description={lang[2]}/>;
            selectOptions.push(s);
        })
        return (
            <div>
                <div>
                    <label className="pf-c-form__label" htmlFor="expression">
                        <span className="pf-c-form__label-text">{"Data Format"}</span>
                        <span className="pf-c-form__label-required" aria-hidden="true"> *</span>
                    </label>
                    <Select
                        variant={SelectVariant.typeahead}
                        aria-label={"dataFormat"}
                        onToggle={() => {
                            this.openSelect()
                        }}
                        onSelect={(e, dataFormat, isPlaceholder) => this.dataFormatChanged(dataFormat.toString(), value)}
                        selections={dataFormat}
                        isOpen={this.state.selectIsOpen}
                        aria-labelledby={"dataFormat"}
                        direction={SelectDirection.down}
                    >
                        {selectOptions}
                    </Select>
                </div>
                <div className="object">
                    <div>
                        {this.getPropertyFields(value, propertiesMain)}
                        {propertiesAdvanced.length > 0 &&
                            <ExpandableSection
                                toggleText={'Advanced properties'}
                                onToggle={isExpanded => this.setState({isShowAdvanced: !this.state.isShowAdvanced})}
                                isExpanded={this.state.isShowAdvanced}>
                                {this.getPropertyFields(value, propertiesAdvanced)}
                            </ExpandableSection>}
                    </div>

                </div>
            </div>
        )
    }
}