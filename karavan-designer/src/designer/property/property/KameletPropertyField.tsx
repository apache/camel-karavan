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
    Switch, InputGroup, Button, TextArea, Tooltip, capitalize, Text, TextVariants
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import ExpandIcon from "@patternfly/react-icons/dist/js/icons/expand-icon";
import CompressIcon from "@patternfly/react-icons/dist/js/icons/compress-icon";
import {Property} from "karavan-core/lib/model/KameletModels";
import {InfrastructureSelector} from "./InfrastructureSelector";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";
import {usePropertiesHook} from "../usePropertiesHook";
import {Select, SelectDirection, SelectOption, SelectVariant} from "@patternfly/react-core/deprecated";
import {KubernetesIcon} from "../../icons/ComponentIcons";

interface Props {
    property: Property,
    value: any,
    required: boolean,
}

export function KameletPropertyField(props: Props) {

    const {onParametersChange} = usePropertiesHook();

    const [selectIsOpen, setSelectIsOpen] = useState<boolean>(false);
    const [showEditor, setShowEditor] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [infrastructureSelector, setInfrastructureSelector] = useState<boolean>(false);
    const [infrastructureSelectorProperty, setInfrastructureSelectorProperty] = useState<string | undefined>(undefined);
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
            }, 3000);
            return () => {
                clearInterval(interval)
            }
        }
    }, [checkChanges, textValue])

    function parametersChanged (parameter: string, value: string | number | boolean | any, pathParameter?: boolean)  {
        setCheckChanges(false);
        onParametersChange(parameter, value, pathParameter);
        setSelectIsOpen(false);
        setSelectStatus(new Map<string, boolean>([[parameter, false]]))
    }

    function openSelect(propertyName: string, isExpanded: boolean) {
        setSelectStatus(new Map<string, boolean>([[propertyName, isExpanded]]))
    }

    function isSelectOpen(propertyName: string): boolean {
        return selectStatus.has(propertyName) && selectStatus.get(propertyName) === true;
    }

    function selectInfrastructure (value: string)  {
        // check if there is a selection
        const textVal = ref.current;
        const cursorStart = textVal.selectionStart;
        const cursorEnd = textVal.selectionEnd;
        if (cursorStart !== cursorEnd){
            const prevValue =  props.value;
            const selectedText = prevValue.substring(cursorStart, cursorEnd)
            value = prevValue.replace(selectedText, value);
        }
        const propertyId = infrastructureSelectorProperty;
        if (propertyId){
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            setTextValue(value);
            parametersChanged(propertyId, value);
            setInfrastructureSelector(false);
            setInfrastructureSelectorProperty(undefined);
        }
    }

    function openInfrastructureSelector (propertyName: string)  {
        setInfrastructureSelector(true);
        setInfrastructureSelectorProperty(propertyName);
    }

    function getInfrastructureSelectorModal() {
        return (
            <InfrastructureSelector
                dark={false}
                isOpen={infrastructureSelector}
                onClose={() => setInfrastructureSelector(false)}
                onSelect={selectInfrastructure}/>)
    }

    function getStringInput() {
        const {property, value} = props;
        const prefix = "parameters";
        const id = prefix + "-" + property.id;
        const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.id);
        const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? KubernetesIcon("infra-button") : <DockerIcon/>
        const showInfraSelectorButton = inInfrastructure && !showEditor && !noInfraSelectorButton;
        const selectFromList: boolean = property.enum !== undefined && property?.enum?.length > 0;
        const selectOptions: JSX.Element[] = [];
        if (selectFromList && property.enum) {
            selectOptions.push(...property.enum.map((value: string) =>
                <SelectOption key={value} value={value ? value.trim() : value}/>));
        }
        return <InputGroup>
            {showInfraSelectorButton  &&
                <Tooltip position="bottom-end" content={"Select from " + capitalize(InfrastructureAPI.infrastructure)}>
                    <Button variant="control" onClick={e => openInfrastructureSelector(property.id)}>
                        {icon}
                    </Button>
                </Tooltip>}
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
            {((!selectFromList && !showEditor) || property.format === "password") &&
                <TextInput
                    ref={ref}
                    className="text-field" isRequired
                    type={property.format && !showPassword ? "password" : "text"}
                    id={id} name={id}
                    value={textValue}
                    onBlur={_ => parametersChanged(property.id, textValue)}
                    onChange={(_, v) => {
                        setTextValue(v);
                        setCheckChanges(true);
                    }}
                />
            }
            {(!selectFromList && showEditor) && property.format !== "password" &&
                <TextArea autoResize={true}
                          className="text-field" isRequired
                          type="text"
                          id={id} name={id}
                          value={textValue}
                          onBlur={_ => parametersChanged(property.id, textValue)}
                          onChange={(_, v) => {
                              setTextValue(v);
                              setCheckChanges(true);
                          }}
                />
            }
            {property.format !== "password" &&
                <Tooltip position="bottom-end" content={showEditor ? "Change to TextField" : "Change to Text Area"}>
                    <Button variant="control" onClick={e => setShowEditor(!showEditor)}>
                        {showEditor ? <CompressIcon/> : <ExpandIcon/>}
                    </Button>
                </Tooltip>
            }
            {property.format === "password" &&
                <Tooltip position="bottom-end" content={showPassword ? "Hide" : "Show"}>
                    <Button variant="control" onClick={e => setShowPassword(!showPassword)}>
                        {showPassword ? <ShowIcon/> : <HideIcon/>}
                    </Button>
                </Tooltip>
            }
        </InputGroup>
    }

    // function isNumeric (num: any) {
    //     return (typeof(num) === 'number' || (typeof(num) === "string" && num.trim() !== '')) && !isNaN(num as number);
    // }

    function getNumberInput() {
        return (
            <TextInput id={id}
                       name={id}
                       className="text-field"
                       isRequired
                       type='number'
                       value={textValue?.toString()}
                       customIcon={<Text component={TextVariants.p}>{property.type}</Text>}
                       onBlur={(_) => {
                           parametersChanged(property.id, Number(textValue))
                       }}
                       onChange={(_, v) => {
                        setTextValue(v);
                        setCheckChanges(true);
                      }}
            />
        )
    }

    const property =  props.property;
    const value =  props.value;
    const prefix = "parameters";
    const id = prefix + "-" + property.id;
    return (
        <div>
            <FormGroup
                key={id}
                label={property.title}
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
                {property.type === 'string' && getStringInput()}
                {['integer', 'int', 'number'].includes(property.type) && getNumberInput()}
                {property.type === 'boolean' && <Switch
                    id={id} name={id}
                    value={value?.toString()}
                    aria-label={id}
                    isChecked={Boolean(value) === true}
                    onChange={e => parametersChanged(property.id, !Boolean(value))}/>
                }
            </FormGroup>
            {getInfrastructureSelectorModal()}
        </div>
    )
}