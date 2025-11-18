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
    FormGroup,
    FormGroupLabelHelp,
    FormHelperText,
    HelperText,
    HelperTextItem,
    InputGroup,
    Popover,
    SelectOptionProps,
    Switch,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    Tooltip,
    ValidatedOptions
} from '@patternfly/react-core';
import './KameletPropertyField.css';
import {CogIcon, ExclamationCircleIcon, TimesIcon} from '@patternfly/react-icons';
import {Property} from "core/model/KameletModels";
import {ConfigurationSelectorModal} from "./ConfigurationSelectorModal";
import {usePropertiesHook} from "../usePropertiesHook";
import {isSensitiveFieldValid} from "../../utils/ValidatorUtils";
import {FieldSelectScrollable} from "@/components/FieldSelectScrollable";

interface Props {
    property: Property,
    value: any,
    required: boolean,
    expressionEditor: React.ComponentType<any>
}

export function KameletPropertyField(props: Props) {

    const {onParametersChange} = usePropertiesHook();

    const [configurationSelector, setConfigurationSelector] = useState<boolean>(false);
    const [configurationSelectorProperty, setConfigurationSelectorProperty] = useState<string | undefined>(undefined);
    const [configurationSelectorDefaultTab, setConfigurationSelectorDefaultTab] = useState<string>('properties');
    const [selectStatus, setSelectStatus] = useState<Map<string, boolean>>(new Map<string, boolean>());
    const ref = useRef<any>(null);
    const [textValue, setTextValue] = useState<any>();
    const [checkChanges, setCheckChanges] = useState<boolean>(false);

    useEffect(() => setTextValue(value), [])

    useEffect(() => {
        if (checkChanges) {
            const interval = setInterval(() => {
                if (props.value !== textValue) {
                    onParametersChange(property.id, textValue);
                }
            }, 700);
            return () => {
                clearInterval(interval)
            }
        }
    }, [checkChanges, textValue])

    function parametersChanged(parameter: string, value: string | number | boolean | any, pathParameter?: boolean) {
        setCheckChanges(false);
        onParametersChange(parameter, value, pathParameter);
        setSelectStatus(new Map<string, boolean>([[parameter, false]]))
    }

    function openSelect(propertyName: string, isExpanded: boolean) {
        setSelectStatus(new Map<string, boolean>([[propertyName, isExpanded]]))
    }

    function isSelectOpen(propertyName: string): boolean {
        return selectStatus.has(propertyName) && selectStatus.get(propertyName) === true;
    }

    function selectConfiguration(value: string) {
        // check if there is a selection
        const textVal = ref.current;
        const cursorStart = textVal.selectionStart;
        const cursorEnd = textVal.selectionEnd;
        if (cursorStart !== cursorEnd) {
            const prevValue = props.value;
            const selectedText = prevValue.substring(cursorStart, cursorEnd)
            value = prevValue.replace(selectedText, value);
        }
        const propertyId = configurationSelectorProperty;
        if (propertyId) {
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            setTextValue(value);
            parametersChanged(propertyId, value);
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

    function getConfigurationSelectorModal() {
        return (
            configurationSelector && <ConfigurationSelectorModal
                dark={false}
                isOpen={configurationSelector}
                onClose={() => closeConfigurationSelector()}
                name={property.id}
                customCode={value}
                defaultTabIndex={configurationSelectorDefaultTab}
                dslLanguage={undefined}
                title={property.title}
                onSave={(fieldId, value1) => {
                    parametersChanged(property.id, value1)
                    setTextValue(value1);
                    closeConfigurationSelector();
                    setCheckChanges(true);
                }}
                expressionEditor={props.expressionEditor}
                onSelect={selectConfiguration}/>)
    }

    function getOpenConfigButton(property: Property, configurationSelectorDefaultTab: string = 'properties') {
        return (
            <Tooltip position="bottom-end" content="Open config selector">
                <Button icon={<CogIcon/>} variant="control" onClick={e => {
                    setConfigurationSelectorDefaultTab(configurationSelectorDefaultTab)
                    openConfigurationSelector(property.id)
                }}>

                </Button>
            </Tooltip>
        )
    }

    function isNumeric(num: any) {
        return (typeof (num) === 'number' || (typeof (num) === "string" && num.trim() !== '')) && !isNaN(num as number);
    }

    function getSpecialStringInput() {
        const {property, value} = props;
        const prefix = "parameters";
        const id = prefix + "-" + property.id;
        const selectFromList: boolean = property.enum !== undefined && property?.enum?.length > 0;
        const showTextInput = (!selectFromList) || property.format === "password";
        const selectOptions: SelectOptionProps[] = [];
        if (selectFromList && property.enum) {
            property.enum.forEach(value => {
                const v = value ? value.trim() : value;
                selectOptions.push({key: v, value: v, description: v, children: v});
            })
        }
        return <InputGroup className={valueChangedClassName}>
            {selectFromList &&
                <FieldSelectScrollable
                    className='value-changed'
                    selectOptions={selectOptions}
                    value={value}
                    placeholder={'Select...'}
                    onChange={(selectedValue) => {
                        if (selectedValue) {
                            parametersChanged(property.id, selectedValue);
                            setCheckChanges(false);
                        }
                    }}
                />
            }
            {showTextInput &&
                <TextInputGroup className='text-field'>
                    <TextInputGroupMain
                        ref={ref}
                        className="text-field"
                        type='text'
                        autoComplete="off"
                        id={id} name={id}
                        value={textValue || ''}
                        onBlur={_ => {
                            if (isNumeric((textValue))) {
                                parametersChanged(property.id, Number(textValue))
                            } else {
                                parametersChanged(property.id, textValue)
                            }
                        }}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                    />
                    <TextInputGroupUtilities>
                        <Button icon={<TimesIcon aria-hidden={true}/>} variant="plain" className='button-clear' onClick={_ => {
                            parametersChanged(property.id, '');
                            setTextValue('');
                            setCheckChanges(true);
                        }}/>
                        {showTextInput && getOpenConfigButton(property)}
                    </TextInputGroupUtilities>
                </TextInputGroup>
            }
        </InputGroup>
    }

    function hasValueChanged(property: Property, value: any): boolean {
        const isSet = value !== undefined;
        const isDefault = property.default !== undefined && value?.toString() === property.default?.toString();
        return isSet && !isDefault;
    }

    function getLabel(property: Property, value: any) {
        const labelClassName = hasValueChanged(property, value) ? 'value-changed-label' : '';
        return (
            <div style={{display: "flex", flexDirection: 'row', alignItems: 'center', gap: '3px'}}>
                <Content component="p" className={labelClassName}>{property.title}</Content>
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

    const property = props.property;
    const value = props.value;
    const validated = (property.format === 'password' && !isSensitiveFieldValid(value)) ? ValidatedOptions.error : ValidatedOptions.default;
    const prefix = "parameters";
    const id = prefix + "-" + property.id;
    const valueChangedClassName = hasValueChanged(property, value) ? 'value-changed' : '';
    return (
        <div>
            <FormGroup
                key={id}
                className='kamelet-property-form-group'
                label={getLabel(property, value)}
                fieldId={id}
                isRequired={props.required}
                labelHelp={
                    <Popover
                        position={"left"}
                        headerContent={property.title}
                        bodyContent={property.description}
                        footerContent={
                            <div>
                                {property.default !== undefined &&
                                    <div>Default: {property.default.toString()}</div>}
                                {property.example !== undefined && <div>Example: {property.example}</div>}
                            </div>
                        }>
                        <FormGroupLabelHelp aria-label="More info"/>
                    </Popover>
                }>
                {['string', 'integer', 'int', 'number'].includes(property.type) && getSpecialStringInput()}
                {property.type === 'boolean' && <Switch
                    className={valueChangedClassName}
                    id={id} name={id}
                    value={value?.toString()}
                    aria-label={id}
                    isChecked={Boolean(value) === true}
                    onChange={e => parametersChanged(property.id, !Boolean(value))}/>
                }
                {getValidationHelper()}
            </FormGroup>
            {getConfigurationSelectorModal()}
        </div>
    )
}