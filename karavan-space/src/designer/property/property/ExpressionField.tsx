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
import {
	FormGroup,
	Popover
} from '@patternfly/react-core';
import {
	Select,
	SelectVariant,
	SelectDirection,
	SelectOption
} from '@patternfly/react-core/deprecated';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {CamelMetadataApi, Languages, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {ExpressionDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslPropertyField} from "./DslPropertyField";
import {CamelUi} from "../../utils/CamelUi";

interface Props {
    property: PropertyMeta,
    value: CamelElement,
    onExpressionChange?: (propertyName: string, exp: ExpressionDefinition) => void,
}

export function ExpressionField(props: Props) {

    const [selectIsOpen, setSelectIsOpen] = useState<boolean>(false);

    function openSelect (isExpanded: boolean) {
        setSelectIsOpen(isExpanded);
    }

    function expressionChanged (language: string, value: CamelElement) {
        if (language !== (value as any).expressionName) {
            const className = CamelMetadataApi.getCamelLanguageMetadataByName(language)?.className;
            value = CamelDefinitionApi.createExpression(className || '', {expression: (value as any).expression}); // perhaps copy other similar fields later
        }
        const exp = new ExpressionDefinition();
        (exp as any)[language] = value;
        if (props.value) {
            (exp as any).uuid = props.value.uuid;
        }
        props.onExpressionChange?.(props.property.name, exp);
        setSelectIsOpen(false);
    }

    function propertyChanged (fieldId: string, value: string | number | boolean | any) {
        const expression = getExpressionValue();
        if (expression) {
            (expression as any)[fieldId] = value;
            expressionChanged(getValueLanguage(), expression);
        }
    }

    function getValueClassName (): string {
        return CamelDefinitionApiExt.getExpressionLanguageClassName(props.value) || 'SimpleExpression';
    }

    function getValueLanguage (): string {
        return CamelDefinitionApiExt.getExpressionLanguageName(props.value) || 'simple';
    }

    function getExpressionValue (): CamelElement {
        const language = getValueLanguage();
        return props.value && (props.value as any)[language]
            ? (props.value as any)[language]
            : CamelDefinitionApi.createExpression(getValueClassName(), props.value);
    }

    function getProps (): PropertyMeta[] {
        const dslName = getValueClassName();
        return CamelDefinitionApiExt.getElementProperties(dslName)
            .filter(p => p.name !== 'id')
            .filter(p => !p.isObject || (p.isObject && !CamelUi.dslHasSteps(p.type)) || (dslName === 'CatchDefinition' && p.name === 'onWhen'));
    }

    const property: PropertyMeta = props.property;
    const value = getExpressionValue();
    const dslLanguage = Languages.find((l: [string, string, string]) => l[0] === getValueLanguage());
    const selectOptions: JSX.Element[] = []
    Languages.forEach((lang: [string, string, string]) => {
        const s = <SelectOption key={lang[0]} value={lang[0]} description={lang[2]}/>;
        selectOptions.push(s);
    })
    return (
        <div>
            <label className="pf-v5-c-form__label" htmlFor="expression">
                <span className="pf-v5-c-form__label-text">Language</span>
                <span className="pf-v5-c-form__label-required" aria-hidden="true"> *</span>
            </label>
            <Select
                variant={SelectVariant.typeahead}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    openSelect(isExpanded)
                }}
                onSelect={(e, lang, isPlaceholder) => {
                    expressionChanged(lang.toString(), value);
                }}
                selections={dslLanguage}
                isOpen={selectIsOpen}
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
                                className="pf-v5-c-form__group-label-help">
                            <HelpIcon />
                        </button>
                    </Popover> : <div></div>
                }>
                {value && getProps().map((property: PropertyMeta) =>
                    <DslPropertyField key={property.name + props.value?.uuid}
                                      property={property}
                                      value={value ? (value as any)[property.name] : undefined}
                                      dslLanguage={dslLanguage}
                                      onExpressionChange={exp => {}}
                                      onParameterChange={parameter => {}}
                                      onDataFormatChange={dataFormat => {}}
                                      onPropertyChange={propertyChanged}
                    />
                )}
            </FormGroup>
        </div>
    )
}