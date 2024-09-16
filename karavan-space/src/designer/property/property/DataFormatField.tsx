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
    ExpandableSection
} from '@patternfly/react-core';
import {
    Select,
    SelectVariant,
    SelectDirection,
    SelectOption
} from '@patternfly/react-core/deprecated';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
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

interface Props {
    dslName: string,
    value: CamelElement,
    onDataFormatChange?: (value: DataFormatDefinition) => void
    integration: Integration,
    dark: boolean,
}

export function DataFormatField(props: Props) {

    const [propertyFilter, changedOnly, requiredOnly] = usePropertiesStore((s) => [s.propertyFilter, s.changedOnly, s.requiredOnly], shallow)
    const [selectIsOpen, setSelectIsOpen] = useState<boolean>(false);
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    function getDataFormatString() {
        return CamelDefinitionApiExt.getDataFormat(props.value)?.name || 'json';
    }

    function openSelect() {
        setSelectIsOpen(true)
    }

    function dataFormatChanged(dataFormat: string, value?: CamelElement) {
        if (dataFormat !== (value as any).dataFormatName) {
            const className = CamelMetadataApi.getCamelDataFormatMetadataByName(dataFormat)?.className;
            value = CamelDefinitionApi.createDataFormat(className || '', {}); // perhaps copy other similar fields later
        }
        const df = CamelDefinitionApi.createStep(props.dslName, {});
        (df as any)[dataFormat] = value;
        (df as any)['uuid'] = props.value.uuid;
        (df as any)['id'] = (props.value as any)['id'];

        props.onDataFormatChange?.(df);
        setSelectIsOpen(false);
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
    const selectOptions: JSX.Element[] = []
    DataFormats.forEach((lang: [string, string, string]) => {
        const s = <SelectOption key={lang[0]} value={lang[0]} description={lang[2]}/>;
        selectOptions.push(s);
    })
    return (
        <div>
            <div>
                <label className="pf-v5-c-form__label" htmlFor="expression">
                    <span className="pf-v5-c-form__label-text">{"Data Format"}</span>
                    <span className="pf-v5-c-form__label-required" aria-hidden="true"> *</span>
                </label>
                <Select
                    variant={SelectVariant.typeahead}
                    aria-label={"dataFormat"}
                    onToggle={() => {
                        openSelect()
                    }}
                    onSelect={(_, dataFormat, isPlaceholder) => dataFormatChanged(dataFormat.toString(), value)}
                    selections={dataFormat}
                    isOpen={selectIsOpen}
                    aria-labelledby={"dataFormat"}
                    direction={SelectDirection.down}
                >
                    {selectOptions}
                </Select>
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