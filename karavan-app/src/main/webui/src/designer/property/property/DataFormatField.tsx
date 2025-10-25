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
    ExpandableSection, SelectOptionProps
} from '@patternfly/react-core';
import {CamelMetadataApi, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {DataFormatDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslPropertyField} from "./DslPropertyField";
import {DataFormats} from "karavan-core/lib/model/CamelMetadata";
import {usePropertiesStore} from "../PropertyStore";
import {shallow} from "zustand/shallow";
import {PropertyUtil} from "./PropertyUtil";
import {FieldSelectScrollable} from "@/components/FieldSelectScrollable";

interface Props {
    dslName: string,
    value: CamelElement,
    onDataFormatChange?: (value: DataFormatDefinition) => void
    integration: Integration,
    expressionEditor: React.ComponentType<any>
}

export function DataFormatField(props: Props) {

    const [propertyFilter, changedOnly, requiredOnly] = usePropertiesStore((s) => [s.propertyFilter, s.changedOnly, s.requiredOnly], shallow)
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    function getDataFormatString() {
        return CamelDefinitionApiExt.getDataFormat(props.value)?.name || 'json';
    }

    function dataFormatChanged(dataFormat: string, value?: CamelElement) {
        if (dataFormat !== (value as any).dataFormatName) {
            const className = CamelMetadataApi.getCamelDataFormatMetadataByName(dataFormat)?.className;
            value = CamelDefinitionApi.createDataFormat(className || '', {}); // perhaps copy other similar fields later
        }
        const df: any = CamelDefinitionApi.createStep(props.dslName, {});
        const pValue = props.value as any
        df[dataFormat] = value;
        df.uuid = props.value.uuid;
        df.variableReceive = pValue.variableReceive;
        df.variableSend = pValue.variableSend;
        df.description = pValue.description;
        df.disabled = pValue.disabled;
        df.id = pValue.id;

        props.onDataFormatChange?.(df);
    }

    function propertyChanged(fieldId: string, value: string | number | boolean | any) {
        const df = getDataFormatValue();
        if (df) {
            (df as any)[fieldId] = value;
            dataFormatChanged(getDataFormatString(), df);
        }
    }

    function getDataFormatValue(): CamelElement {
        const dataFormatString = getDataFormatString();
        return (props.value as any)[dataFormatString]
            ? (props.value as any)[dataFormatString]
            : CamelDefinitionApi.createDataFormat(dataFormatString, (props.value as any)[dataFormatString]);
    }

    function getPropertyValue(property: PropertyMeta) {
        const value = getDataFormatValue();
        return value ? (value as any)[property.name] : undefined;
    }

    function getFilteredProperties(): PropertyMeta[] {
        let propertyMetas = CamelDefinitionApiExt.getElementPropertiesByName(dataFormatString).sort((a, b) => a.name === 'library' ? -1 : 1);
        const filter = propertyFilter.toLocaleLowerCase()
        propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || p.name.toLocaleLowerCase().includes(filter) || p.label.toLocaleLowerCase().includes(filter) || p.displayName.toLocaleLowerCase().includes(filter));
        if (requiredOnly) {
            propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || p.required);
        }
        if (changedOnly) {
            propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || PropertyUtil.hasDslPropertyValueChanged(p, getPropertyValue(p)));
        }
        return propertyMetas
    }

    function getPropertySelectorChanged(): boolean {
        return requiredOnly || changedOnly || propertyFilter?.trim().length > 0;
    }

    function getShowExpanded(): boolean {
        return showAdvanced || getPropertySelectorChanged();
    }

    function getPropertyFields(value: any, properties: PropertyMeta[]) {
        return (<>
            {value && properties?.map((property: PropertyMeta) =>
                <DslPropertyField
                    key={property.name}
                    property={property}
                    value={value ? (value as any)[property.name] : undefined}
                    onPropertyChange={propertyChanged}
                    expressionEditor={props.expressionEditor}
                />
            )}
        </>)
    }
    const value = getDataFormatValue();
    const dataFormatString = getDataFormatString();
    const dataFormat = DataFormats.find((l: [string, string, string]) => l[0] === dataFormatString);
    const properties = getFilteredProperties();
    const propertiesMain = properties.filter(p => !p.label.includes("advanced"));
    const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));
    const selectOptions: SelectOptionProps[] = [];
    DataFormats.forEach((lang: [string, string, string]) => {
        selectOptions.push({key: lang[0], value: lang[0], description: lang[2], children: lang[1]});
    })
    return (
        <div>
            <div>
                <label className="-pf-v6-c-form__label" htmlFor="expression">
                    <span className="-pf-v6-c-form__label-text">{"Data Format"}</span>
                    <span className="-pf-v6-c-form__label-required" aria-hidden="true"> *</span>
                </label>
                <FieldSelectScrollable
                    className='value-changed'
                    selectOptions={selectOptions}
                    value={dataFormat?.[0]}
                    placeholder={'Select...'}
                    onChange={(selectedValue) => {
                        if (selectedValue) dataFormatChanged(selectedValue, value)
                    }}
                />
            </div>
            <div className="object">
                <div>
                    {getPropertyFields(value, propertiesMain)}
                    {propertiesAdvanced.length > 0 &&
                        <ExpandableSection
                            toggleText={'Advanced data format properties'}
                            onToggle={(_event, isExpanded) => setShowAdvanced(!showAdvanced)}
                            isExpanded={getShowExpanded()}>
                            {getPropertyFields(value, propertiesAdvanced)}
                        </ExpandableSection>}
                </div>

            </div>
        </div>
    )
}