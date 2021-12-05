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
    TextArea,
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {CamelElement} from "../../model/CamelModel";
import {CamelApiExt} from "../../api/CamelApiExt";
import {CamelMetadataApi, DataFormats, PropertyMeta} from "../../api/CamelMetadata";

interface Props {
    element: CamelElement,
}

interface State {
    property: PropertyMeta,
    element?: CamelElement,
    selectStatus: Map<string, boolean>
}

export class DataFormatField extends React.Component<Props, State> {

    public state: State = {
        property: new PropertyMeta('id', 'Id', "The id of this node", 'string', '', '', false, false, false, false),
        selectStatus: new Map<string, boolean>(),
        element: this.props.element,
    }

    setDataFormat = (dataFormat: string, props: any) => {
        console.log(dataFormat);
        console.log(props);
    }

    openSelect = (propertyName: string) => {
        this.setState({selectStatus: new Map<string, boolean>([[propertyName, true]])});
    }

    isSelectOpen = (propertyName: string): boolean => {
        return this.state.selectStatus.has(propertyName) && this.state.selectStatus.get(propertyName) === true;
    }

    render() {
        const fieldId = "dataFormat";
        const dataFormat  = CamelApiExt.getDataFormat(this.state.element)
        const dataFormatName = dataFormat ? dataFormat[0] : '';
        const value = dataFormat ? CamelApiExt.getExpressionValue(this.state.element) : undefined;
        const properties = CamelMetadataApi.getCamelDataFormatMetadata(dataFormatName)?.properties;
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
                        <TextArea
                            autoResize
                            className="text-field" isRequired
                            type={"text"}
                            id={fieldId+"text"} name={fieldId+"text"}
                            height={"100px"}
                            value={value?.toString()}
                            onChange={e => this.setDataFormat(dataFormatName, e)}/>
                    </div>
                </FormGroup>
            </div>
        )
    }
}