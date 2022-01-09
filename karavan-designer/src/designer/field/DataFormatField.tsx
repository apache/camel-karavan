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
    FormGroup,
    Popover,
    Select,
    SelectVariant,
    SelectDirection,
    SelectOption,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {CamelElement} from "karavan-core/lib/model/CamelModel";
import {CamelApiExt} from "karavan-core/lib/api/CamelApiExt";
import {CamelMetadataApi, DataFormats, PropertyMeta} from "karavan-core/lib/api/CamelMetadata";
import {DataFormat} from "karavan-core/lib/model/CamelDataFormat";
import {DslPropertyField} from "./DslPropertyField";

interface Props {
    element: CamelElement,
    onDataFormatChange?: (dataFormat: string, value?: DataFormat) => void
}

interface State {
    selectStatus: Map<string, boolean>
}

export class DataFormatField extends React.Component<Props, State> {

    public state: State = {
        selectStatus: new Map<string, boolean>(),
    }

    setDataFormat = (dataFormat: string, props: any) => {
        const oldDataFormat  = CamelApiExt.getDataFormat(this.props.element);
        if (oldDataFormat && oldDataFormat[0] === dataFormat){
            this.props.onDataFormatChange?.call(this, dataFormat, props);
        } else {
            this.props.onDataFormatChange?.call(this, dataFormat, undefined);
        }
        this.setState({selectStatus: new Map<string, boolean>([[dataFormat, false]])});
    }

    openSelect = (dataFormat: string) => {
        this.setState({selectStatus: new Map<string, boolean>([[dataFormat, true]])});
    }

    isSelectOpen = (dataFormat: string): boolean => {
        return this.state.selectStatus.has(dataFormat) && this.state.selectStatus.get(dataFormat) === true;
    }

    propertyChanged = (fieldId: string, fieldValue: string | number | boolean | any) => {
        const dataFormat  = CamelApiExt.getDataFormat(this.props.element);
        const dataFormatName = dataFormat ? dataFormat[0] : '';
        const value = dataFormat ? dataFormat[1] : undefined;
        (value as any)[fieldId] = fieldValue;
        this.setDataFormat(dataFormatName, value);
    }

    render() {
        const fieldId = "dataFormat";
        const dataFormat  = CamelApiExt.getDataFormat(this.props.element);
        const dataFormatName = dataFormat ? dataFormat[0] : '';
        const value = dataFormat ? dataFormat[1] : undefined;
        const properties = CamelMetadataApi.getCamelDataFormatMetadata(dataFormatName)?.properties
            .sort((a, b) => a.name === 'library' ? -1: 1);
        const selectOptions: JSX.Element[] = []
        DataFormats.forEach((df: [string, string, string]) => {
            const s = <SelectOption key={df[0]} value={df[0]} description={df[2]}/>;
            selectOptions.push(s);
        })
        return (
            <div>
                <FormGroup
                    key={fieldId}
                    label="Data Format"
                    fieldId="dataFormat"
                    labelIcon={
                        <Popover
                            position={"left"}
                            headerContent="Data Format"
                            bodyContent="Specified format for transmission over a transport or component">
                            <button type="button" aria-label="More info" onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                                    className="pf-c-form__group-label-help">
                                <HelpIcon noVerticalAlign/>
                            </button>
                        </Popover>}
                >
                    <div className="dataformat">
                        <Select
                            variant={SelectVariant.typeahead}
                            aria-label="dataFormat"
                            onToggle={isExpanded => {
                                this.openSelect(fieldId)
                            }}
                            onSelect={(e, df, isPlaceholder) => this.setDataFormat(df.toString(), value)}
                            selections={dataFormatName}
                            isOpen={this.isSelectOpen(fieldId)}
                            aria-labelledby={fieldId}
                            direction={SelectDirection.down}
                        >
                            {selectOptions}
                        </Select>
                        {properties && properties.map((property: PropertyMeta) =>
                            <DslPropertyField property={property}
                                              value={value ? (value as any)[property.name] : undefined}
                                              onChange={this.propertyChanged}
                            />
                        )}
                    </div>
                </FormGroup>
            </div>
        )
    }
}