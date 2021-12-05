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
    SelectOption, TextArea,
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {Languages, PropertyMeta} from "../../api/CamelMetadata";
import {CamelApiExt} from "../../api/CamelApiExt";

interface Props {
    property: PropertyMeta,
    value: any,
    onExpressionChange?: (language: string, value: string | undefined) => void
}

interface State {
    selectIsOpen: boolean;
}

export class ExpressionField extends React.Component<Props, State> {

    public state: State = {
        selectIsOpen: false,
    }

    openSelect = () => {
        this.setState({selectIsOpen: true});
    }

    expressionChanged = (language: string, value: string | undefined) => {
        this.props.onExpressionChange?.call(this, language, value);
        this.setState({selectIsOpen: false});
    }

    render() {
        const property: PropertyMeta = this.props.property;
        const prefix = "language";
        const language = CamelApiExt.getExpressionLanguage(this.props.value) || 'Simple'
        const dslLanguage = Languages.find((l: [string, string, string]) => l[0] === language);
        const value = language ? CamelApiExt.getExpressionValue(this.props.value) : undefined;
        const selectOptions: JSX.Element[] = []
        Languages.forEach((lang: [string, string, string]) => {
            const s = <SelectOption key={lang[0]} value={lang[0]} description={lang[2]}/>;
            selectOptions.push(s);
        })
        return (
            <div>
                <FormGroup key={prefix + "-" + property.name} fieldId={property.name}>
                    <Select
                        variant={SelectVariant.typeahead}
                        aria-label={property.name}
                        onToggle={isExpanded => {
                            this.openSelect()
                        }}
                        onSelect={(e, lang, isPlaceholder) => this.expressionChanged(lang.toString(), value)}
                        selections={dslLanguage}
                        isOpen={this.state.selectIsOpen}
                        aria-labelledby={property.name}
                        direction={SelectDirection.down}
                    >
                        {selectOptions}
                    </Select>
                </FormGroup>
                <FormGroup
                    key={property.name}
                    fieldId={property.name}
                    labelIcon={property.description ?
                        <Popover
                            position={"left"}
                            headerContent={property.displayName}
                            bodyContent={property.description}>
                            <button type="button" aria-label="More info" onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                                    className="pf-c-form__group-label-help">
                                <HelpIcon noVerticalAlign/>
                            </button>
                        </Popover> : <div></div>
                    }>
                    <TextArea
                        autoResize
                        className="text-field" isRequired
                        type={"text"}
                        id={property.name} name={property.name}
                        height={"100px"}
                        value={value?.toString()}
                        onChange={e => this.expressionChanged(language, e)}/>
                </FormGroup>
            </div>
        )
    }
}