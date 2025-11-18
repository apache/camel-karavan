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
import {ExpandableSection, FormGroup, FormGroupLabelHelp, Popover, SelectOptionProps} from '@patternfly/react-core';
import {CamelMetadataApi, Languages, PropertyMeta} from "core/model/CamelMetadata";
import {CamelDefinitionApiExt} from "core/api/CamelDefinitionApiExt";
import {ExpressionDefinition} from "core/model/CamelDefinition";
import {CamelElement} from "core/model/IntegrationDefinition";
import {CamelDefinitionApi} from "core/api/CamelDefinitionApi";
import {DslPropertyField} from "./DslPropertyField";
import {CamelUi} from "../../utils/CamelUi";
import {usePropertiesStore} from "../PropertyStore";
import {shallow} from "zustand/shallow";
import {PropertyUtil} from "./PropertyUtil";
import {DslPropertyFieldSelectScrollable} from "@/integration-designer/property/property/DslPropertyFieldSelectScrollable";

interface Props {
    property: PropertyMeta,
    value: CamelElement,
    onExpressionChange?: (propertyName: string, exp: ExpressionDefinition) => void,
    expressionEditor: React.ComponentType<any>
}

export function ExpressionField(props: Props) {

    const [propertyFilter, changedOnly, requiredOnly] = usePropertiesStore((s) => [s.propertyFilter, s.changedOnly, s.requiredOnly], shallow)
    const [propsAreOpen, setPropsAreOpen] = useState<boolean>(false);


    function expressionChanged(language: string, value: CamelElement) {
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
    }

    function propertyChanged(fieldId: string, value: string | number | boolean | any) {
        const expression = getExpressionValue();
        if (expression) {
            (expression as any)[fieldId] = value;
            expressionChanged(getValueLanguage(), expression);
        }
    }

    function getValueClassName(): string {
        return CamelDefinitionApiExt.getExpressionLanguageClassName(props.value) || 'GroovyExpression';
    }

    function getValueLanguage(): string {
        return CamelDefinitionApiExt.getExpressionLanguageName(props.value) || 'groovy';
    }

    function getExpressionValue(): CamelElement {
        const language = getValueLanguage();
        return props.value && (props.value as any)[language]
            ? (props.value as any)[language]
            : CamelDefinitionApi.createExpression(getValueClassName(), props.value);
    }

    function getProps(): PropertyMeta[] {
        const dslName = getValueClassName();
        const filter = propertyFilter.toLocaleLowerCase();
        let propertyMetas = CamelDefinitionApiExt.getElementProperties(dslName)
            .filter(p => p.name !== 'id')
            .filter(p => p.name !== 'expression')
            .filter(p => !p.isObject || (p.isObject && !CamelUi.dslHasSteps(p.type)) || (dslName === 'CatchDefinition' && p.name === 'onWhen'))
            .filter(p => p.name === 'parameters' || p.name.toLocaleLowerCase().includes(filter) || p.label.toLocaleLowerCase().includes(filter) || p.displayName.toLocaleLowerCase().includes(filter));
        if (requiredOnly) {
            propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || p.required);
        }
        if (changedOnly) {
            propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || PropertyUtil.hasDslPropertyValueChanged(p, getPropertyValue(p)));
        }
        return propertyMetas
    }

    function getPropertyValue(property: PropertyMeta) {
        const value = getExpressionValue();
        return value ? (value as any)[property.name] : undefined;
    }

    function getPropertySelectorChanged(): boolean {
        return requiredOnly || changedOnly || propertyFilter?.trim().length > 0;
    }

    function getShowExpanded(): boolean {
        return propsAreOpen || getPropertySelectorChanged();
    }

    function getExpressionProps(): PropertyMeta | undefined {
        const dslName = getValueClassName();
        return CamelDefinitionApiExt.getElementProperties(dslName).filter(p => p.name === 'expression').at(0);
    }

    const property: PropertyMeta = props.property;
    const value = getExpressionValue();
    const dslLanguage = Languages.find((l: [string, string, string]) => l[0] === getValueLanguage());
    const selectOptions: SelectOptionProps[] = Languages.map((lang: [string, string, string]) => ({value: lang[0], description: lang[2], children: lang[1]}));
    const exp = getExpressionProps();
    const expValue = value && exp ? (value as any)[exp.name] : undefined;
    const valueChangedClassName = PropertyUtil.hasDslPropertyValueChanged(property, value) ? 'value-changed' : '';
    return (
        <div style={{display: 'flex', flexDirection: 'column', gridGap: '8px'}}>
            <label className="pf-v6-c-form__label" htmlFor="expression">
                <span className="pf-v6-c-form__label-text value-changed-label">Language</span>
                <span className="pf-v6-c-form__label-required" aria-hidden="true"> *</span>
            </label>
            <DslPropertyFieldSelectScrollable
                value={dslLanguage?.[0]}
                property={property}
                selectOptions={selectOptions}
                placeholder='Select Expression Language'
                onPropertyChange={(_, val) => expressionChanged(val, value)}
            />
            <FormGroup
                key={property.name}
                fieldId={property.name}
                labelHelp={property.description ?
                    <Popover
                        position={"left"}
                        headerContent={property.displayName}
                        bodyContent={property.description}>
                        <FormGroupLabelHelp aria-label="More info"/>
                    </Popover> : <div></div>
                }>
                {exp && <DslPropertyField key={exp.name + props.value?.uuid}
                                          property={exp}
                                          value={expValue}
                                          dslLanguage={dslLanguage}
                                          onExpressionChange={exp => {
                                          }}
                                          onParameterChange={parameter => {
                                          }}
                                          onDataFormatChange={dataFormat => {
                                          }}
                                          onPropertyChange={propertyChanged}
                                          expressionEditor={props.expressionEditor}
                />}
                <ExpandableSection
                    toggleText={'Expression properties'}
                    onToggle={(_event, isExpanded) => setPropsAreOpen(isExpanded)}
                    isExpanded={getShowExpanded()}>
                    {value && getProps().map((property: PropertyMeta) =>
                        <DslPropertyField key={property.name + props.value?.uuid}
                                          property={property}
                                          value={value ? (value as any)[property.name] : undefined}
                                          dslLanguage={dslLanguage}
                                          onExpressionChange={exp => {
                                          }}
                                          onParameterChange={parameter => {
                                          }}
                                          onDataFormatChange={dataFormat => {
                                          }}
                                          onPropertyChange={propertyChanged}
                                          expressionEditor={props.expressionEditor}
                        />
                    )}
                </ExpandableSection>
            </FormGroup>
        </div>
    )
}