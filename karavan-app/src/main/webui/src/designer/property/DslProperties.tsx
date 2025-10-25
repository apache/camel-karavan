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
import React, {useEffect, useState, ReactElement} from 'react';
import {
    Button,
    Content,
    ContentVariants,
    ExpandableSection,
    Form,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    Title,
    ToggleGroup,
    ToggleGroupItem,
    Tooltip,
} from '@patternfly/react-core';
import './DslProperties.css';
import {DataFormatField} from "./property/DataFormatField";
import {DslPropertyField} from "./property/DslPropertyField";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelUi} from "../utils/CamelUi";
import {CamelMetadataApi, DataFormats, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {IntegrationHeader} from "../utils/IntegrationHeader";
import CloneIcon from "@patternfly/react-icons/dist/esm/icons/clone-icon";
import {useDesignerStore, useIntegrationStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {usePropertiesHook} from "./usePropertiesHook";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import {PropertiesHeader} from "./PropertiesHeader";
import {PropertyUtil} from "./property/PropertyUtil";
import {usePropertiesStore} from "./PropertyStore";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import {RouteTemplateDefinition} from "karavan-core/lib/model/CamelDefinition";

interface Props {
    designerType: 'routes' | 'rest' | 'beans',
    expressionEditor: React.ComponentType<any>;
}

export function DslProperties(props: Props) {

    const [integration] = useIntegrationStore((s) => [s.integration], shallow)

    const {
        cloneElement,
        onDataFormatChange,
        onPropertyChange,
        onParametersChange,
        onExpressionChange
    } =
        usePropertiesHook(props.designerType);

    const [selectedStep, setParameterPlaceholders]
        = useDesignerStore((s) => [s.selectedStep, s.setParameterPlaceholders], shallow)

    const [propertyFilter, changedOnly, requiredOnly, setChangedOnly, sensitiveOnly, setSensitiveOnly, setPropertyFilter, setRequiredOnly]
        = usePropertiesStore((s) => [s.propertyFilter, s.changedOnly, s.requiredOnly, s.setChangedOnly, s.sensitiveOnly, s.setSensitiveOnly, s.setPropertyFilter, s.setRequiredOnly], shallow)

    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

    useEffect(() => {
        setRequiredOnly(false);
        setChangedOnly(false);
        setSensitiveOnly(false);
        setPropertyFilter('');
        getRouteTemplateParameters()
    }, [selectedStep?.uuid])

    function getRouteTemplateParameters() {
        if (selectedStep) {
            const root = CamelDefinitionApiExt.findTopRouteElement(integration, selectedStep.uuid);
            if ('RouteTemplateDefinition' === root?.dslName) {
                const paramPlaceholders: [string, string][] = (root as RouteTemplateDefinition).parameters?.map(p => [p.name, p.description || '']) || [];
                setParameterPlaceholders(paramPlaceholders);
            }
        }
    }

    function getClonableElementHeader(): ReactElement {
        const title = selectedStep && CamelDisplayUtil.getTitle(selectedStep);
        const description = selectedStep?.dslName ? CamelMetadataApi.getCamelModelMetadataByClassName(selectedStep?.dslName)?.description : title;
        const descriptionLines: string [] = description ? description?.split("\n") : [""];
        return (
            <div className="headers">
                <div className="top">
                    <Title headingLevel="h1" size="md">{title}</Title>
                    <Tooltip content="Clone element" position="bottom">
                        <Button variant="link" onClick={() => cloneElement()} icon={<CloneIcon/>}/>
                    </Tooltip>
                </div>
                {descriptionLines.map((desc, index, array) => <Content key={index}
                                                                       component={ContentVariants.p}>{desc}</Content>)}
            </div>
        )
    }

    function getPropertiesHeader(): ReactElement {
        if (props.designerType === 'routes') return <PropertiesHeader designerType={props.designerType}/>
        else return getClonableElementHeader();
    }

    function getProperties(): PropertyMeta[] {
        const dslName = selectedStep?.dslName;
        return CamelDefinitionApiExt.getElementProperties(dslName)
            .filter((p: PropertyMeta) => dslName === 'InterceptSendToEndpointDefinition' || p.name !== 'uri') // do not show uri except InterceptSendToEndpointDefinition
            .filter((p: PropertyMeta) => p.name !== 'id') // do not show id
            // .filer((p: PropertyMeta) => (showAdvanced && p.label.includes('advanced')) || (!showAdvanced && !p.label.includes('advanced')))
            .filter((p: PropertyMeta) => !p.isObject || (p.isObject && !CamelUi.dslHasSteps(p.type)) || (p.name === 'onWhen'))
            .filter((p: PropertyMeta) => !(dslName === 'RestDefinition' && ['get', 'post', 'put', 'patch', 'delete', 'head'].includes(p.name)))
            .filter((p: PropertyMeta) => !(dslName === 'RouteTemplateDefinition' && ['route', 'beans'].includes(p.name)));
        // .filter((p: PropertyMeta) => dslName && !(['RestDefinition', 'GetDefinition', 'PostDefinition', 'PutDefinition', 'PatchDefinition', 'DeleteDefinition', 'HeadDefinition'].includes(dslName) && ['param', 'responseMessage'].includes(p.name))) // TODO: configure this properties
    }

    function sortProperties(p1: PropertyMeta, p2: PropertyMeta): number {
        const isConvert = selectedStep?.dslName.startsWith('Convert');

        if (isConvert) {
            if (p1.name === 'description' && p2.name !== 'description') return 1;
            if (p1.name !== 'description' && p2.name === 'description') return -1;

            if (p1.name === 'name' && p2.name !== 'name') return -1;
            if (p1.name !== 'name' && p2.name === 'name') return 1;
        }

        if (selectedStep?.dslName.startsWith('Set')) {
            if (p1.name === 'name' && p2.name !== 'name') return -1;
            if (p1.name !== 'name' && p2.name === 'name') return 1;
        }

        return 0;
    }

    function getPropertyFields(properties: PropertyMeta[]) {
        return (<>
            {properties.sort(sortProperties).map((property: PropertyMeta) =>
                <DslPropertyField key={property.name}
                                  property={property}
                                  element={selectedStep}
                                  value={getPropertyValue(property)}
                                  onExpressionChange={onExpressionChange}
                                  onParameterChange={onParametersChange}
                                  onDataFormatChange={onDataFormatChange}
                                  onPropertyChange={onPropertyChange}
                                  expressionEditor={props.expressionEditor}
                />
            )}
        </>)
    }

    function getPropertyValue(property: PropertyMeta) {
        return selectedStep ? (selectedStep as any)[property.name] : undefined;
    }

    function getFilteredProperties(): PropertyMeta[] {
        let propertyMetas = !dataFormatElement ? getProperties() : getProperties().filter(p => !dataFormats.includes(p.name));
        const filter = propertyFilter.toLocaleLowerCase()
        propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || p.name.toLocaleLowerCase().includes(filter) || p.label.toLocaleLowerCase().includes(filter) || p.displayName.toLocaleLowerCase().includes(filter));
        if (requiredOnly) {
            propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || p.required);
        }
        if (changedOnly) {
            propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || PropertyUtil.hasDslPropertyValueChanged(p, getPropertyValue(p)));
        }
        if (sensitiveOnly) {
            propertyMetas = propertyMetas.filter(p => p.name === 'parameters' || p.secret);
        }
        return propertyMetas
    }

    const dataFormats = DataFormats.map(value => value[0]);
    const dataFormatElement = selectedStep !== undefined && ['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName);
    const properties = getFilteredProperties();
    const propertiesMain = properties.filter(p => !p.label.includes("advanced"));
    const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));

    function getPropertySelector() {
        return (
            <TextInputGroup className='property-selector-group'>
                <TextInputGroupUtilities>
                    <ToggleGroup className='property-selector' aria-label="properties selctor">
                        <ToggleGroupItem
                            text="Required"
                            buttonId="requiredOnly"
                            isSelected={requiredOnly}
                            onChange={(_, selected) => setRequiredOnly(selected)}
                        />
                        <ToggleGroupItem
                            text="Changed"
                            buttonId="changedOnly"
                            isSelected={changedOnly}
                            onChange={(_, selected) => setChangedOnly(selected)}
                        />
                        <ToggleGroupItem
                            text="Sensitive"
                            buttonId="sensitiveOnly"
                            isSelected={sensitiveOnly}
                            onChange={(_, selected) => setSensitiveOnly(selected)}
                        />
                    </ToggleGroup>
                </TextInputGroupUtilities>
                <TextInputGroupMain
                    value={propertyFilter}
                    placeholder="filter by name"
                    type="text"
                    autoComplete={"off"}
                    autoFocus={true}
                    onChange={(_event, value) => setPropertyFilter(value)}
                    aria-label="filter by name"
                />
                <TextInputGroupUtilities>
                    <Button icon={<TimesIcon aria-hidden={true}/>} variant="plain" onClick={_ => setPropertyFilter('')}/>
                </TextInputGroupUtilities>
            </TextInputGroup>
        )
    }

    function getPropertySelectorChanged(): boolean {
        return requiredOnly || changedOnly || sensitiveOnly || propertyFilter?.trim().length > 0;
    }

    function getShowExpanded(): boolean {
        return showAdvanced || getPropertySelectorChanged();
    }

    return (
        <div key={selectedStep ? selectedStep.uuid : 'integration'}
             className='properties'>
            <Form autoComplete="off" onSubmit={event => event.preventDefault()}>
                {selectedStep === undefined && <IntegrationHeader/>}
                {selectedStep && getPropertiesHeader()}
                {selectedStep !== undefined && getPropertySelector()}
                {getPropertyFields(propertiesMain)}
                {selectedStep && ['MarshalDefinition', 'UnmarshalDefinition'].includes(selectedStep.dslName) &&
                    <DataFormatField
                        integration={integration}
                        dslName={selectedStep.dslName}
                        value={selectedStep}
                        onDataFormatChange={onDataFormatChange}
                        expressionEditor={props.expressionEditor}
                    />
                }
                {selectedStep && propertiesAdvanced.length > 0 &&
                    <ExpandableSection
                        toggleText={'Processors advanced properties'}
                        onToggle={(_event, isExpanded) => setShowAdvanced(!showAdvanced)}
                        isExpanded={getShowExpanded()}>
                        <div className="parameters">
                            {getPropertyFields(propertiesAdvanced)}
                        </div>
                    </ExpandableSection>}
            </Form>
        </div>
    )
}
