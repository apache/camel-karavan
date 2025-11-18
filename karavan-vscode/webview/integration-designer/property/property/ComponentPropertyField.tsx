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
    Button,
    Content,
    ContentVariants,
    FormGroup,
    FormGroupLabelHelp,
    FormHelperText,
    HelperText,
    HelperTextItem,
    InputGroup,
    InputGroupItem,
    Popover,
    SelectOptionProps,
    Switch,
    TextArea,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    Tooltip,
    ValidatedOptions
} from '@patternfly/react-core';
import './ComponentPropertyField.css';
import {ComponentProperty} from "@/core/model/ComponentModels";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {CamelElement} from "@/core/model/IntegrationDefinition";
import {ToDefinition} from "@/core/model/CamelDefinition";
import {ConfigurationSelectorModal} from "./ConfigurationSelectorModal";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import {CogIcon, PlusIcon, TimesIcon} from '@patternfly/react-icons';
import {usePropertiesHook} from "../usePropertiesHook";
import {useDesignerStore, useIntegrationStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {INTERNAL_COMPONENTS} from "@/core/api/ComponentApi";
import {PropertyUtil} from "./PropertyUtil";
import {isSensitiveFieldValid} from "../../utils/ValidatorUtils";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import {CamelDefaultStepProperty} from "../../utils/CamelDefaultStepProperty";
import {FileReferenceDropdown} from "./FileReferenceDropdown";
import {FieldSelectWithCreate} from "@/components/FieldSelectWithCreate";
import {FieldSelectScrollable} from "@/components/FieldSelectScrollable";
import {CamelMetadataApi} from "@/core/model/CamelMetadata";

const prefix = "parameters";
const beanPrefix = "#bean:";
const filePrefix = 'resource:';

interface Props {
    property: ComponentProperty,
    element?: CamelElement,
    value: any,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => void,
    expressionEditor: React.ComponentType<any>
    hideConfigSelector?: boolean,
}

export function ComponentPropertyField(props: Props) {

    const {onParametersChange, getInternalComponentName} = usePropertiesHook();
    const {property, element, value, onParameterChange, expressionEditor, hideConfigSelector} = props;

    const [integration, files] = useIntegrationStore((state) => [state.integration, state.files], shallow)
    const [ beans, stepDoubleClicked] = useDesignerStore((s) => [s.beans, s.stepDoubleClicked], shallow)

    const [configurationSelector, setConfigurationSelector] = useState<boolean>(false);
    const [configurationSelectorProperty, setConfigurationSelectorProperty] = useState<string | undefined>(undefined);
    const [configurationSelectorDefaultTab, setConfigurationSelectorDefaultTab] = useState<string>('properties');
    const [id, setId] = useState<string>(prefix + "-" + property.name);
    const [dslLanguage, setDslLanguage] = useState<any>();
    const [textValue, setTextValue] = useState<any>();
    const ref = useRef<any>(null);
    const [checkChanges, setCheckChanges] = useState<boolean>(false);

    useEffect(() => setTextValue(value), [])

    useEffect(() => {
        if (stepDoubleClicked && element) {
            const dsp = CamelDefaultStepProperty.findDslDefaultProperty(element.dslName);
            if (dsp?.propertyName === property.name) {
                if (!property.supportFileReference) {
                    setConfigurationSelectorDefaultTab(dsp.tab)
                    openConfigurationSelector(property.name);
                } else {
                    onFileReferenceClick(value);
                }
            }
        }
    }, [stepDoubleClicked])

    useEffect(() => {
        if (checkChanges) {
            const interval = setInterval(() => {
                if (value !== textValue) {
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
        onParameterChange?.(parameter, value, pathParameter, newRoute);
    }

    function getSelectBean(property: ComponentProperty, value: any) {
        const selectOptions: SelectOptionProps[] = [];
        if (beans) {
            selectOptions.push(...beans.map((bean) => ({key: value, value: beanPrefix + bean.name, description: bean.type, children: beanPrefix + bean.name})));
        }
        return (
            <FieldSelectScrollable
                selectOptions={selectOptions}
                value={value}
                placeholder={'Select...'}
                onChange={selectedValue => parametersChanged(property.name, selectedValue)}
            />
        )
    }

    function canBeInternalUri(property: ComponentProperty): boolean {
        if (element && ['ToDefinition', 'WireTapDefinition'].includes(element.dslName) && (property.name === 'name' || property.name === 'address')) {
            const uri: string = (element as ToDefinition).uri || '';
            const parts = uri.split(":");
            return parts.length > 0 && INTERNAL_COMPONENTS.includes(parts[0]);
        } else {
            return false;
        }
    }

    function checkUri(startsWith: string): boolean {
        if (element && element.dslName === 'ToDefinition' && (property.name === 'name' || property.name === 'address')) {
            const uri: string = (element as ToDefinition).uri || '';
            return uri.startsWith(startsWith);
        } else {
            return false;
        }
    }

    function getInternalUriSelect(property: ComponentProperty, value: any) {
        const componentName = getInternalComponentName(property.name, element);
        const internalUris = CamelUi.getInternalRouteUris(integration, componentName, false);
        let uris: string[] = CamelUi.getInternalUris(files, checkUri('direct'), checkUri('seda'), checkUri('vertx'));
        uris.push(...internalUris);
        uris = [...new Set(uris.map(e => e.includes(":") ? e.split(":")?.at(1) || "" : e))]
        if (value && value.length > 0 && !uris.includes(value)) {
            uris.unshift(value);
        }
        return (
            <FieldSelectWithCreate
                placeholder={'Select a URI'}
                className={valueChangedClassName}
                listOfValues={[...uris]}
                onSelectElement={selectedValue => parametersChanged(property.name, selectedValue, property.kind === 'path', undefined)}
                value={value}
                utilities={[
                    <Tooltip key={1} position="bottom-end" content={"Create route"}>
                        <Button isDisabled={value === undefined} variant="plain" onClick={e => {
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
                ]}
            />
        )
    }

    function onFileReferenceClick(text: string) {
        const filename = text?.replace(filePrefix, '');
        if (text?.startsWith(filePrefix) && text?.endsWith("." + property.inputLanguage) && !files.find(f => f.name === filename)) {
            InfrastructureAPI.onCreateNewFile(filename, "", true)
        } else {
            InfrastructureAPI.onInternalConsumerClick(undefined, undefined, undefined, filename)
        }
    }

    function getFileReferencedField(property: ComponentProperty, value: any) {
        const isNull: boolean = value === undefined || value === null || value?.toString().trim() === '';
        const isResource: boolean = isNull || value?.startsWith(filePrefix);
        const isText: boolean = isNull || !value?.startsWith(filePrefix);

        const options: SelectOptionProps[] = files
            .filter(f => property.inputLanguage === '' || property.inputLanguage === undefined || f.name.endsWith(property.inputLanguage))
            .map(f => {
                const val = f.name;
                return {value: val, label: val, children: val}
            })
        const additionalItems  = (!isNull) ? [getOpenConfigButton(property, 'editor')] : []
        return (
            <div>
                {isText &&
                    <TextInputGroup className={'text-field ' + valueChangedClassName}>
                        <TextArea
                            className="text-field" isRequired
                            type={"text"}
                            id={property.name}
                            name={property.name}
                            height={"100px"}
                            value={textValue?.toString()}
                            onBlur={_ => parametersChanged(property.name, textValue, property.kind === 'path')}
                            placeholder={`Type ${property.inputLanguage}`}
                            onChange={(_, v) => {
                                setTextValue(v);
                                setCheckChanges(true);
                            }}
                        />
                        <TextInputGroupUtilities>
                            {getOpenConfigButton(property, 'editor')}
                        </TextInputGroupUtilities>
                    </TextInputGroup>
                }
                {isResource &&
                    <FileReferenceDropdown
                        initialValue={value}
                        placeholder={`Select or Create expression file (.${property.inputLanguage})`}
                        valueChangedClassName={valueChangedClassName}
                        inputLanguage={property.inputLanguage}
                        options={options}
                        additionalItems={additionalItems}
                        onChange={(text: string) => {
                            if (text?.endsWith(`.${property.inputLanguage}`)) {
                                const filename = text?.replace(filePrefix, '');
                                setTextValue(`${filePrefix}${filename}`)
                            } else if (text?.trim().length === 0) {
                                setTextValue(text);
                            }
                            setCheckChanges(true);
                        }}
                        onFileReferenceClick={onFileReferenceClick}
                    />
                }
            </div>
        )
    }

    function selectInfrastructure(value: string) {
        // check if there is a selection
        const textVal = ref.current;
        const cursorStart = textVal.selectionStart;
        const cursorEnd = textVal.selectionEnd;
        if (cursorStart !== cursorEnd) {
            const prevValue = value;
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

    function openConfigurationSelector(propertyName: string) {
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
                dslLanguage={dslLanguage}
                title={property.displayName}
                onSave={(fieldId, value1) => {
                    parametersChanged(property.name, value1)
                    setTextValue(value1);
                    closeConfigurationSelector();
                }}
                expressionEditor={expressionEditor}
                onSelect={selectInfrastructure}/>)
    }

    function getOpenConfigButton(property: ComponentProperty, configurationSelectorDefaultTab: string = 'properties') {
        if (element?.dslName === 'ToDefinition' && (element as any)?.uri === 'sql' && property.name === 'query') {
            configurationSelectorDefaultTab = 'editor'
        }
        return (
            hideConfigSelector
            ? <></>
            : <Tooltip position="bottom-end" content="Open config selector">
                <Button icon={<CogIcon/>} variant="plain" className='open-config-buton' onClick={e => {
                    const dslLanguage = (property.inputLanguage && CamelMetadataApi.getLanguage(property.inputLanguage)) ?? [property.inputLanguage, property.inputLanguage, property.inputLanguage];
                    setDslLanguage(dslLanguage);
                    setConfigurationSelectorDefaultTab(configurationSelectorDefaultTab)
                    openConfigurationSelector(property.name)
                }}>
                </Button>
            </Tooltip>
        )
    }

    function getStringInput(property: ComponentProperty) {
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.name);
        return <InputGroup className={valueChangedClassName}>
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
                    <Button icon={<TimesIcon aria-hidden={true}/>} variant="plain" className='button-clear' onClick={_ => {
                        parametersChanged(property.name, '');
                        setTextValue('');
                        setCheckChanges(true);
                    }}/>
                    {!noInfraSelectorButton && getOpenConfigButton(property)}
                </TextInputGroupUtilities>
            </TextInputGroup>
        </InputGroup>
    }

    function getSpecialStringInput(property: ComponentProperty) {
        return (
            <InputGroup className={valueChangedClassName}>
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
                            <Content component={ContentVariants.p}>{property.type}</Content>
                            <Button icon={<TimesIcon aria-hidden={true}/>} variant="plain" className='button-clear' onClick={_ => {
                                parametersChanged(property.name, '');
                                setTextValue('');
                                setCheckChanges(true);
                            }}/>
                            {getOpenConfigButton(property)}
                        </TextInputGroupUtilities>
                    </TextInputGroup>
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getSelect(property: ComponentProperty, value: any) {
        const selectOptions: SelectOptionProps[] = []
        if (property.enum && property.enum.length > 0) {
            property.enum.forEach(v => selectOptions.push({key: v?.trim(), value: v?.trim(), children: v?.trim()}));
        }
        return (
            <FieldSelectScrollable
                selectOptions={selectOptions}
                value={value !== undefined ? value.toString() : property.defaultValue}
                placeholder={'Select...'}
                onChange={selectedValue => parametersChanged(property.name, selectedValue, property.kind === 'path')}
            />
        )
    }

    function getSwitch(property: ComponentProperty) {
        const isValueBoolean = (textValue?.toString() === 'true' || textValue?.toString() === 'false');
        const isDisabled = textValue?.toString().includes("{") || textValue?.toString().includes("}")
        const isChecked = textValue !== undefined ? Boolean(textValue) : (property.defaultValue !== undefined && ['true', true].includes(property.defaultValue))
        return (
            <InputGroup className={"input-group " + valueChangedClassName}>
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
                <TextInputGroup>
                    <TextInputGroupMain
                        ref={ref}
                        className="text-field"
                        type="text"
                        autoComplete="off"
                        id={id} name={id}
                        value={!isValueBoolean ? textValue?.toString() : ''}
                        onBlur={_ => onParametersChange(property.name, textValue)}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                    />
                    <TextInputGroupUtilities>
                        {getOpenConfigButton(property)}
                    </TextInputGroupUtilities>
                </TextInputGroup>
            </InputGroup>
        )
    }


    function getLabel(property: ComponentProperty, value: any) {
        const labelClassName = PropertyUtil.hasComponentPropertyValueChanged(property, value) ? 'value-changed-label' : '';
        return (
            <div style={{display: "flex", flexDirection: 'row', alignItems: 'center', gap: '3px'}}>
                <Content component="p" className={labelClassName}>{property.displayName}</Content>
            </div>
        )
    }

    function getValidationHelper() {
        return (
            validated !== ValidatedOptions.default
                ? <FormHelperText>
                    <HelperText>
                        <HelperTextItem icon={<ExclamationCircleIcon/>} variant={validated}>
                            {'Must be a placeholder {{ }} or secret {{secret:name/key}}'}
                        </HelperTextItem>
                    </HelperText>
                </FormHelperText>
                : <></>
        )
    }

    const validated = (property.secret && !isSensitiveFieldValid(value)) ? ValidatedOptions.error : ValidatedOptions.default;
    const valueChangedClassName = PropertyUtil.hasComponentPropertyValueChanged(property, value) ? 'value-changed' : '';
    const supportFileReference = property.supportFileReference;
    return (
        <FormGroup
            key={id}
            className='component-property-form-group'
            label={getLabel(property, value)}
            isRequired={property.required}
            labelHelp={
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
                    <FormGroupLabelHelp aria-label="More info"/>
                </Popover>
            }>
            {supportFileReference && getFileReferencedField(property, value)}
            {canBeInternalUri(property) && getInternalUriSelect(property, value)}
            {property.type === 'string' && property.enum === undefined && !canBeInternalUri(property) && !supportFileReference
                && getStringInput(property)}
            {['duration', 'integer', 'int', 'number'].includes(property.type) && property.enum === undefined && !canBeInternalUri(property)
                && getSpecialStringInput(property)}
            {['object'].includes(property.type)
                && getSelectBean(property, value)}
            {['enum'].includes(property.type)
                && getSelect(property, value)}
            {property.type === 'boolean' && getSwitch(property)}
            {getInfrastructureSelectorModal()}
            {getValidationHelper()}
        </FormGroup>
    )
}
