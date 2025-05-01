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
    InputGroup,
    Button,
    Tooltip,
    Text,
    InputGroupItem,
    ValidatedOptions,
    FormHelperText, HelperText, HelperTextItem, FormGroup, Popover, Switch, TextInputGroupMain, TextInputGroupUtilities, TextInputGroup
} from '@patternfly/react-core';
import '../../karavan.css';
import './KameletPropertyField.css';
import "@patternfly/patternfly/patternfly.css";
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import {Property} from "karavan-core/lib/model/KameletModels";
import {ConfigurationSelectorModal} from "./ConfigurationSelectorModal";
import {usePropertiesHook} from "../usePropertiesHook";
import {Select, SelectDirection, SelectOption, SelectVariant} from "@patternfly/react-core/deprecated";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {isSensitiveFieldValid} from "../../utils/ValidatorUtils";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import CogIcon from "@patternfly/react-icons/dist/js/icons/cog-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

interface Props {
    property: Property,
    value: any,
    required: boolean,
    expressionEditor: React.ComponentType<any>
}

export function KameletPropertyField(props: Props) {

    const {onParametersChange} = usePropertiesHook();

    const [dark] = useDesignerStore((s) => [s.dark], shallow)
    const [configurationSelector, setConfigurationSelector] = useState<boolean>(false);
    const [configurationSelectorProperty, setConfigurationSelectorProperty] = useState<string | undefined>(undefined);
    const [configurationSelectorDefaultTab, setConfigurationSelectorDefaultTab] = useState<string>('properties');
    const [selectStatus, setSelectStatus] = useState<Map<string, boolean>>(new Map<string, boolean>());
    const ref = useRef<any>(null);
    const [textValue, setTextValue] = useState<any>();
    const [checkChanges, setCheckChanges] = useState<boolean>(false);

    useEffect(()=> setTextValue(value), [])

    useEffect(()=> {
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

    function parametersChanged (parameter: string, value: string | number | boolean | any, pathParameter?: boolean)  {
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
        if (cursorStart !== cursorEnd){
            const prevValue =  props.value;
            const selectedText = prevValue.substring(cursorStart, cursorEnd)
            value = prevValue.replace(selectedText, value);
        }
        const propertyId = configurationSelectorProperty;
        if (propertyId){
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
                <Button variant="control" className='open-config-buton' onClick={e => {
                    setConfigurationSelectorDefaultTab(configurationSelectorDefaultTab)
                    openConfigurationSelector(property.id)
                }}>
                    <CogIcon style={{fill: 'var(--pf-v5-global--Color--200)'}}/>
                </Button>
            </Tooltip>
        )
    }

    function isNumeric (num: any) {
        return (typeof(num) === 'number' || (typeof(num) === "string" && num.trim() !== '')) && !isNaN(num as number);
    }

    function getSpecialStringInput() {
        const {property, value} = props;
        const prefix = "parameters";
        const id = prefix + "-" + property.id;
        const selectFromList: boolean = property.enum !== undefined && property?.enum?.length > 0;
        const showTextInput = (!selectFromList) || property.format === "password";
        const selectOptions: JSX.Element[] = [];
        if (selectFromList && property.enum) {
            selectOptions.push(...property.enum.map((value: string) =>
                <SelectOption key={value} value={value ? value.trim() : value}/>));
        }
        return <InputGroup className={valueChangedClassName}>
            {selectFromList &&
                <Select
                    id={id} name={id}
                    placeholderText="Select or type an URI"
                    variant={SelectVariant.typeahead}
                    aria-label={property.id}
                    onToggle={(_event, isExpanded) => {
                        openSelect(property.id, isExpanded)
                    }}
                    onSelect={(e, value, isPlaceholder) => {
                        parametersChanged(property.id, value);
                        setCheckChanges(false);
                    }}
                    selections={value}
                    isOpen={isSelectOpen(property.id)}
                    isCreatable={true}
                    createText=""
                    isInputFilterPersisted={true}
                    aria-labelledby={property.id}
                    direction={SelectDirection.down}>
                    {selectOptions}
                </Select>
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
                        <Button variant="plain" className='button-clear' onClick={_ => {
                            parametersChanged(property.id, '');
                            setTextValue('');
                            setCheckChanges(true);
                        }}>
                            <TimesIcon aria-hidden={true}/>
                        </Button>
                    </TextInputGroupUtilities>
                </TextInputGroup>
            }
            {showTextInput &&
                <InputGroupItem>
                    {getOpenConfigButton(property)}
                </InputGroupItem>
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
                <Text className={labelClassName}>{property.title}</Text>
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

    const property =  props.property;
    const value =  props.value;
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
                isRequired={ props.required}
                labelIcon={
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
                        <button type="button" aria-label="More info" onClick={e => e.preventDefault()}
                                className="pf-v5-c-form__group-label-help">
                            <HelpIcon />
                        </button>
                    </Popover>
                }>
                {/*{property.type === 'string' && getStringInput()}*/}
                {['string','integer', 'int', 'number'].includes(property.type) && getSpecialStringInput()}
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