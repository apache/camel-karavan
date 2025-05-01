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
import React, {useEffect, useRef, useState} from 'react';
import {
    FormGroup,
    TextInput,
    Popover,
    Switch,
    InputGroup,
    Tooltip,
    Button,
    InputGroupItem,
    TextInputGroup,
    TextVariants,
    Text, ValidatedOptions, FormHelperText, HelperText, HelperTextItem, TextInputGroupMain, TextInputGroupUtilities
} from '@patternfly/react-core';
import {
    Select,
    SelectVariant,
    SelectDirection,
    SelectOption
} from '@patternfly/react-core/deprecated';
import '../../karavan.css';
import './ComponentPropertyField.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {ToDefinition} from "karavan-core/lib/model/CamelDefinition";
import {ConfigurationSelectorModal} from "./ConfigurationSelectorModal";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {usePropertiesHook} from "../usePropertiesHook";
import {useDesignerStore, useIntegrationStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {INTERNAL_COMPONENTS} from "karavan-core/lib/api/ComponentApi";
import {PropertyUtil} from "./PropertyUtil";
import {isSensitiveFieldValid} from "../../utils/ValidatorUtils";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import CogIcon from "@patternfly/react-icons/dist/js/icons/cog-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

const prefix = "parameters";
const beanPrefix = "#bean:";

interface Props {
    property: ComponentProperty,
    element?: CamelElement,
    value: any,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => void,
    expressionEditor: React.ComponentType<any>
}

export function ComponentPropertyField(props: Props) {

    const {onParametersChange, getInternalComponentName} = usePropertiesHook();

    const [integration, files] = useIntegrationStore((state) => [state.integration, state.files], shallow)
    const [dark, setSelectedStep, beans] = useDesignerStore((s) =>
        [s.dark, s.setSelectedStep, s.beans], shallow)

    const [selectStatus, setSelectStatus] = useState<Map<string, boolean>>(new Map<string, boolean>());
    const [configurationSelector, setConfigurationSelector] = useState<boolean>(false);
    const [configurationSelectorProperty, setConfigurationSelectorProperty] = useState<string | undefined>(undefined);
    const [configurationSelectorDefaultTab, setConfigurationSelectorDefaultTab] = useState<string>('properties');
    const [id, setId] = useState<string>(prefix + "-" + props.property.name);
    const [textValue, setTextValue] = useState<any>();
    const ref = useRef<any>(null);
    const [checkChanges, setCheckChanges] = useState<boolean>(false);

    useEffect(()=> setTextValue(value), [])

    useEffect(()=> {
        if (checkChanges) {
            const interval = setInterval(() => {
                if (props.value !== textValue) {
                    parametersChanged(property.name, textValue);
                }
            }, 700);
            return () => {
                clearInterval(interval)
            }
        }
    }, [checkChanges, textValue])

    function parametersChanged(parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) {
        setCheckChanges(false);
        onParametersChange(parameter, value, pathParameter, newRoute);
        setSelectStatus(new Map<string, boolean>([[parameter, false]]))
    }

    function openSelect(propertyName: string, isExpanded: boolean) {
        setSelectStatus(new Map<string, boolean>([[propertyName, isExpanded]]))
    }

    function isSelectOpen(propertyName: string): boolean {
        return selectStatus.has(propertyName) && selectStatus.get(propertyName) === true;
    }

    function getSelectBean(property: ComponentProperty, value: any) {
        const selectOptions: React.JSX.Element[] = [];
        if (beans) {
            selectOptions.push(<SelectOption key={0} value={"Select..."} isPlaceholder/>);
            selectOptions.push(...beans.map((bean) => <SelectOption key={bean.name} value={beanPrefix + bean.name}
                                                                    description={bean.type}/>));
        }
        return (
            <Select
                className={valueChangedClassName}
                id={id} name={id}
                variant={SelectVariant.typeahead}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => parametersChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isCreatable={true}
                createText=""
                isOpen={isSelectOpen(property.name)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    function canBeInternalUri(property: ComponentProperty): boolean {
        if (props.element && props.element.dslName === 'ToDefinition' && (property.name === 'name' || property.name === 'address')) {
            const uri: string = (props.element as ToDefinition).uri || '';
            const parts = uri.split(":");
            return parts.length > 0 && INTERNAL_COMPONENTS.includes(parts[0]);
        } else {
            return false;
        }
    }

    function checkUri(startsWith: string): boolean {
        if (props.element && props.element.dslName === 'ToDefinition' && (property.name === 'name' || property.name === 'address')) {
            const uri: string = (props.element as ToDefinition).uri || '';
            return uri.startsWith(startsWith);
        } else {
            return false;
        }
    }

    function getInternalUriSelect(property: ComponentProperty, value: any) {
        const selectOptions: JSX.Element[] = [];
        const componentName = getInternalComponentName(property.name, props.element);
        const internalUris = CamelUi.getInternalRouteUris(integration, componentName, false);
        let uris: string[] = CamelUi.getInternalUris(files, checkUri('direct'), checkUri('seda'), checkUri('vertx'));
        uris.push(...internalUris);
        uris = [...new Set(uris.map(e => e.includes(":") ? e.split(":")?.at(1) || "" : e))]
        if (value && value.length > 0 && !uris.includes(value)) {
            uris.unshift(value);
        }
        if (uris && uris.length > 0) {
            selectOptions.push(...uris.map((value: string) =>
                <SelectOption key={value} value={value ? value.trim() : value}/>));
        }
        return <InputGroup id={id} name={id} className={valueChangedClassName}>
            <InputGroupItem isFill>
                <Select
                    id={id} name={id}
                    placeholderText="Select or type an URI"
                    variant={SelectVariant.typeahead}
                    aria-label={property.name}
                    onToggle={(_event, isExpanded) => {
                        openSelect(property.name, isExpanded)
                    }}
                    onSelect={(e, value, isPlaceholder) => {
                        parametersChanged(property.name, (!isPlaceholder ? value : undefined), property.kind === 'path', undefined);
                    }}
                    selections={value}
                    isOpen={isSelectOpen(property.name)}
                    isCreatable={true}
                    createText=""
                    isInputFilterPersisted={true}
                    aria-labelledby={property.name}
                    direction={SelectDirection.down}>
                    {selectOptions}
                </Select>
            </InputGroupItem>
            <InputGroupItem>
                <Tooltip position="bottom-end" content={"Create route"}>
                    <Button isDisabled={value === undefined} variant="control" onClick={e => {
                        if (value) {
                            InfrastructureAPI.onCreateNewRoute(componentName, property.name, value);
                        //     const newRoute = !internalUris.includes(value.toString())
                        //         ? CamelUi.createNewInternalRoute(componentName.concat(...':', value.toString()))
                        //         : undefined;
                        //     parametersChanged(property.name, value, property.kind === 'path', newRoute);
                        }
                    }}>
                        {<PlusIcon/>}
                    </Button>
                </Tooltip>
            </InputGroupItem>
        </InputGroup>
    }

    function selectInfrastructure(value: string) {
        // check if there is a selection
        const textVal = ref.current;
        const cursorStart = textVal.selectionStart;
        const cursorEnd = textVal.selectionEnd;
        if (cursorStart !== cursorEnd) {
            const prevValue = props.value;
            const selectedText = prevValue.substring(cursorStart, cursorEnd)
            value = prevValue.replace(selectedText, value);
        }
        const propertyName = configurationSelectorProperty;
        if (propertyName) {
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            setTextValue(value);
            parametersChanged(propertyName, value);
            setConfigurationSelector(false);
            setConfigurationSelectorProperty(undefined);
        }
    }

    function openInfrastructureSelector(propertyName: string) {
        setConfigurationSelector(true);
        setConfigurationSelectorProperty(propertyName);
    }

    function closeConfigurationSelector() {
        setConfigurationSelector(false);
    }


    function getInfrastructureSelectorModal() {
        return (
            configurationSelector && <ConfigurationSelectorModal
                dark={false}
                isOpen={configurationSelector}
                onClose={() => closeConfigurationSelector()}
                name={property.name}
                customCode={value}
                defaultTabIndex={configurationSelectorDefaultTab}
                dslLanguage={undefined}
                title={property.displayName}
                onSave={(fieldId, value1) => {
                    parametersChanged(property.name, value1)
                    setTextValue(value1);
                    closeConfigurationSelector();
                }}
                expressionEditor={props.expressionEditor}
                onSelect={selectInfrastructure}/>)
    }

    function getOpenConfigButton(property: ComponentProperty, configurationSelectorDefaultTab: string = 'properties') {
        return (
            <Tooltip position="bottom-end" content="Open config selector">
                <Button variant="control" className='open-config-buton' onClick={e => {
                    setConfigurationSelectorDefaultTab(configurationSelectorDefaultTab)
                    openInfrastructureSelector(property.name)
                }}>
                    <CogIcon style={{fill: 'var(--pf-v5-global--Color--200)'}}/>
                </Button>
            </Tooltip>
        )
    }
    function getStringInput(property: ComponentProperty) {
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.name);
        return <InputGroup  className={valueChangedClassName}>
            <TextInputGroup>
                <TextInputGroupMain
                    className="text-field"
                    ref={ref}
                    type="text"
                    autoComplete="off"
                    id={id} name={id}
                    value={(textValue !== undefined ? textValue : property.defaultValue) || ''}
                    onBlur={_ => parametersChanged(property.name, textValue, property.kind === 'path')}
                    onChange={(_, v) => {
                        setTextValue(v);
                        setCheckChanges(true);
                    }}
                />
                <TextInputGroupUtilities>
                    <Button variant="plain" className='button-clear' onClick={_ => {
                        parametersChanged(property.name, '');
                        setTextValue('');
                        setCheckChanges(true);
                    }}>
                        <TimesIcon aria-hidden={true}/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
            {!noInfraSelectorButton &&
                <InputGroupItem>
                    {getOpenConfigButton(property)}
                </InputGroupItem>
            }
        </InputGroup>
    }

    function getSpecialStringInput(property: ComponentProperty) {
        return (
            <InputGroup  className={valueChangedClassName}>
                <InputGroupItem isFill>
                    <TextInputGroup className='special-text-field'>
                        <TextInputGroupMain
                            ref={ref}
                            className="text-field"
                            type="text"
                            autoComplete="off"
                            id={id} name={id}
                            value={(textValue !== undefined ? textValue : property.defaultValue) || ''}
                            onBlur={_ => parametersChanged(property.name, textValue, property.kind === 'path')}
                            onChange={(_, v) => {
                                setTextValue(v);
                                setCheckChanges(true);
                            }}
                        />
                        <TextInputGroupUtilities>
                            <Text component={TextVariants.p}>{property.type}</Text>
                            <Button variant="plain" className='button-clear' onClick={_ => {
                                parametersChanged(property.name, '');
                                setTextValue('');
                                setCheckChanges(true);
                            }}>
                                <TimesIcon aria-hidden={true}/>
                            </Button>
                        </TextInputGroupUtilities>
                    </TextInputGroup>
                </InputGroupItem>
                <InputGroupItem>
                    {getOpenConfigButton(property)}
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getSelect(property: ComponentProperty, value: any) {
        const selectOptions: JSX.Element[] = []
        if (property.enum && property.enum.length > 0) {
            selectOptions.push(<SelectOption key={0} value={"Select ..."} isPlaceholder/>);
            property.enum.forEach(v => selectOptions.push(<SelectOption key={v} value={v}/>));
        }
        return (
            <Select
                className={valueChangedClassName}
                id={id} name={id}
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => parametersChanged(property.name, (!isPlaceholder ? value : undefined), property.kind === 'path')}
                selections={value !== undefined ? value.toString() : property.defaultValue}
                isOpen={isSelectOpen(property.name)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    function getSwitch(property: ComponentProperty) {
        const isValueBoolean = (textValue?.toString() === 'true' || textValue?.toString() === 'false');
        const isDisabled = textValue?.toString().includes("{") || textValue?.toString().includes("}")
        const isChecked = textValue !== undefined ? Boolean(textValue) : (property.defaultValue !== undefined && ['true', true].includes(property.defaultValue))
        return (
            <TextInputGroup className={"input-group " + valueChangedClassName}>
                <InputGroupItem>
                    <Switch
                        id={id} name={id}
                        isDisabled={isDisabled}
                        className="switch-placeholder"
                        aria-label={id}
                        isChecked={isChecked}
                        value={textValue?.toString()}
                        onChange={(_, v) => {
                            setTextValue(v);
                            parametersChanged(property.name, v);
                            setCheckChanges(true);
                        }}/>
                </InputGroupItem>
                <InputGroupItem isFill>
                    <TextInput
                        ref={ref}
                        id={property.name + "-placeholder"}
                        name={property.name + "-placeholder"}
                        type="text"
                        validated={validated}
                        aria-label="placeholder"
                        value={!isValueBoolean ? textValue?.toString() : ''}
                        onBlur={_ => onParametersChange(property.name, textValue)}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                    />
                </InputGroupItem>
                <InputGroupItem>
                    {getOpenConfigButton(property)}
                </InputGroupItem>
            </TextInputGroup>
        )
    }


    function getLabel(property: ComponentProperty, value: any) {
        const labelClassName = PropertyUtil.hasComponentPropertyValueChanged(property, value) ? 'value-changed-label' : '';
        return (
            <div style={{display: "flex", flexDirection: 'row', alignItems: 'center', gap: '3px'}}>
                <Text className={labelClassName}>{property.displayName}</Text>
            </div>
        )
    }

    function getValidationHelper() {
        return (
            validated !== ValidatedOptions.default
                ? <FormHelperText>
                    <HelperText>
                        <HelperTextItem icon={<ExclamationCircleIcon />} variant={validated}>
                            {'Must be a placeholder {{ }} or secret {{secret:name/key}}'}
                        </HelperTextItem>
                    </HelperText>
                </FormHelperText>
                : <></>
        )
    }

    const property: ComponentProperty = props.property;
    const value = props.value;
    const validated = (property.secret && !isSensitiveFieldValid(value)) ? ValidatedOptions.error : ValidatedOptions.default;
    const valueChangedClassName = PropertyUtil.hasComponentPropertyValueChanged(property, value) ? 'value-changed' : '';
    return (
        <FormGroup
            key={id}
            className='component-property-form-group'
            label={getLabel(property, value)}
            isRequired={property.required}
            labelIcon={
                <Popover
                    position={"left"}
                    headerContent={property.displayName}
                    bodyContent={property.description}
                    footerContent={
                        <div>
                            {property.defaultValue !== undefined && <div>{"Default: " + property.defaultValue}</div>}
                            {property.required && <div>{property.displayName + " is required"}</div>}
                        </div>
                    }>
                    <button type="button" aria-label="More info" onClick={e => e.preventDefault()}
                            className="pf-v5-c-form__group-label-help">
                        <HelpIcon/>
                    </button>
                </Popover>
            }>
            {canBeInternalUri(property) && getInternalUriSelect(property, value)}
            {property.type === 'string' && property.enum === undefined && !canBeInternalUri(property)
                && getStringInput(property)}
            {['duration', 'integer', 'int', 'number'].includes(property.type) && property.enum === undefined && !canBeInternalUri(property)
                && getSpecialStringInput(property)}
            {['object'].includes(property.type) && !property.enum
                && getSelectBean(property, value)}
            {['string', 'object', 'integer'].includes(property.type) && property.enum
                && getSelect(property, value)}
            {property.type === 'boolean'
                && getSwitch(property)}
            {getInfrastructureSelectorModal()}
            {getValidationHelper()}
        </FormGroup>
    )
}
