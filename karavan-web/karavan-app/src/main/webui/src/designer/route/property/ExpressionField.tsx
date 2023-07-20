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
    SelectOption
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {CamelMetadataApi, Languages, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {ExpressionDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslPropertyField} from "./DslPropertyField";
import {CamelUi} from "../../utils/CamelUi";

interface Props {
    property: PropertyMeta,
    value: CamelElement,
    onExpressionChange?: (propertyName: string, exp: ExpressionDefinition) => void
    integration: Integration,
    dark: boolean,
}

interface State {
    selectIsOpen: boolean;
}

export class ExpressionField extends React.Component<Props, State> {

    public state: State = {
        selectIsOpen: false,
    }

    openSelect = (isExpanded: boolean) => {
        this.setState({selectIsOpen: isExpanded});
    }

    expressionChanged = (language: string, value: CamelElement) => {
        if (language !== (value as any).expressionName) {
            const className = CamelMetadataApi.getCamelLanguageMetadataByName(language)?.className;
            value = CamelDefinitionApi.createExpression(className || '', {expression: (value as any).expression}); // perhaps copy other similar fields later
        }
        const exp = new ExpressionDefinition();
        (exp as any)[language] = value;
        if (this.props.value) (exp as any).uuid = this.props.value.uuid;
        this.props.onExpressionChange?.call(this, this.props.property.name, exp);
        this.setState({selectIsOpen: false});
    }

    propertyChanged = (fieldId: string, value: string | number | boolean | any) => {
        const expression = this.getExpressionValue();
        if (expression) {
            (expression as any)[fieldId] = value;
            this.expressionChanged(this.getValueLanguage(), expression);
        }
    }

    getValueClassName = (): string => {
        return CamelDefinitionApiExt.getExpressionLanguageClassName(this.props.value) || 'SimpleExpression';
    }

    getValueLanguage = (): string => {
        return CamelDefinitionApiExt.getExpressionLanguageName(this.props.value) || 'simple';
    }

    getExpressionValue = (): CamelElement => {
        const language = this.getValueLanguage();
        return this.props.value && (this.props.value as any)[language]
            ? (this.props.value as any)[language]
            : CamelDefinitionApi.createExpression(this.getValueClassName(), this.props.value);
    }

    getProps = (): PropertyMeta[] => {
        const dslName = this.getValueClassName();
        return CamelDefinitionApiExt.getElementProperties(dslName)
            .filter(p => p.name !== 'id')
            .filter(p => !p.isObject || (p.isObject && !CamelUi.dslHasSteps(p.type)) || (dslName === 'CatchDefinition' && p.name === 'onWhen'));
    }

    render() {
        const property: PropertyMeta = this.props.property;
        const value = this.getExpressionValue();
        const dslLanguage = Languages.find((l: [string, string, string]) => l[0] === this.getValueLanguage());
        const selectOptions: JSX.Element[] = []
        Languages.forEach((lang: [string, string, string]) => {
            const s = <SelectOption key={lang[0]} value={lang[0]} description={lang[2]}/>;
            selectOptions.push(s);
        })
        return (
            <div>
                <label className="pf-c-form__label" htmlFor="expression">
                    <span className="pf-c-form__label-text">Language</span>
                    <span className="pf-c-form__label-required" aria-hidden="true"> *</span>
                </label>
                <Select
                    variant={SelectVariant.typeahead}
                    aria-label={property.name}
                    onToggle={isExpanded => {
                        this.openSelect(isExpanded)
                    }}
                    onSelect={(e, lang, isPlaceholder) => {
                        this.expressionChanged(lang.toString(), value);
                    }}
                    selections={dslLanguage}
                    isOpen={this.state.selectIsOpen}
                    aria-labelledby={property.name}
                    direction={SelectDirection.down}
                >
                    {selectOptions}
                </Select>
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
                    {value && this.getProps().map((property: PropertyMeta) =>
                        <DslPropertyField key={property.name + this.props.value?.uuid} property={property}
                                          integration={this.props.integration}
                                          element={value}
                                          value={value ? (value as any)[property.name] : undefined}
                                          onExpressionChange={exp => {}}
                                          onParameterChange={parameter => {console.log(parameter)}}
                                          onDataFormatChange={dataFormat => {console.log(dataFormat)}}
                                          onChange={this.propertyChanged}
                                          dark={this.props.dark}
                                          dslLanguage={dslLanguage}/>
                    )}
                </FormGroup>
            </div>
        )
    }
}