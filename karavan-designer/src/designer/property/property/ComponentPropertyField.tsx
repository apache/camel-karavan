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
    capitalize,
    InputGroupItem,
    TextInputGroup,
    TextVariants,
    Text
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
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {ToDefinition} from "karavan-core/lib/model/CamelDefinition";
import {InfrastructureSelector} from "./InfrastructureSelector";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {usePropertiesHook} from "../usePropertiesHook";
import {useDesignerStore, useIntegrationStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {KubernetesIcon} from "../../icons/ComponentIcons";
import EditorIcon from "@patternfly/react-icons/dist/js/icons/code-icon";
import {ExpressionModalEditor} from "../../../expression/ExpressionModalEditor";
import {PropertyPlaceholderDropdown} from "./PropertyPlaceholderDropdown";

const prefix = "parameters";
const beanPrefix = "#bean:";

interface Props {
    property: ComponentProperty,
    element?: CamelElement,
    value: any,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => void
}

export function ComponentPropertyField(props: Props) {

    const {onParametersChange, getInternalComponentName} = usePropertiesHook();

    const [integration, files] = useIntegrationStore((state) => [state.integration, state.files], shallow)
    const [dark, setSelectedStep, beans] = useDesignerStore((s) =>
        [s.dark, s.setSelectedStep, s.beans], shallow)

    const [selectStatus, setSelectStatus] = useState<Map<string, boolean>>(new Map<string, boolean>());
    const [showEditor, setShowEditor] = useState<boolean>(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [infrastructureSelector, setInfrastructureSelector] = useState<boolean>(false);
    const [infrastructureSelectorProperty, setInfrastructureSelectorProperty] = useState<string | undefined>(undefined);
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
            }, 3000);
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
        const selectOptions: JSX.Element[] = [];
        if (beans) {
            selectOptions.push(<SelectOption key={0} value={"Select..."} isPlaceholder/>);
            selectOptions.push(...beans.map((bean) => <SelectOption key={bean.name} value={beanPrefix + bean.name}
                                                                    description={bean.type}/>));
        }
        return (
            <Select
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
        if (props.element && props.element.dslName === 'ToDefinition' && property.name === 'name') {
            const uri: string = (props.element as ToDefinition).uri || '';
            return uri.startsWith("direct") || uri.startsWith("seda");
        } else {
            return false;
        }
    }

    function checkUri(startsWith: string): boolean {
        if (props.element && props.element.dslName === 'ToDefinition' && property.name === 'name') {
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
        let uris: string[] = CamelUi.getInternalUris(files, checkUri('direct'), checkUri('seda'));
        uris.push(...internalUris);
        uris = [...new Set(uris.map(e => e.includes(":") ? e.split(":")?.at(1) || "" : e))]
        if (value && value.length > 0 && !uris.includes(value)) {
            uris.unshift(value);
        }
        if (uris && uris.length > 0) {
            selectOptions.push(...uris.map((value: string) =>
                <SelectOption key={value} value={value ? value.trim() : value}/>));
        }
        return <InputGroup id={id} name={id}>
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
                            const newRoute = !internalUris.includes(value.toString())
                                ? CamelUi.createNewInternalRoute(componentName.concat(...':', value.toString()))
                                : undefined;
                            parametersChanged(property.name, value, property.kind === 'path', newRoute);
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
        const propertyName = infrastructureSelectorProperty;
        if (propertyName) {
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            setTextValue(value);
            parametersChanged(propertyName, value);
            setInfrastructureSelector(false);
            setInfrastructureSelectorProperty(undefined);
        }
    }

    function openInfrastructureSelector(propertyName: string) {
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

    function getStringInput(property: ComponentProperty) {
        const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.name);
        const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? KubernetesIcon("infra-button") : <DockerIcon/>
        return <InputGroup>
            {inInfrastructure && !showEditor && !noInfraSelectorButton &&
                <Tooltip position="bottom-end"
                         content={"Select from " + capitalize((InfrastructureAPI.infrastructure))}>
                    <Button variant="control" onClick={e => openInfrastructureSelector(property.name)}>
                        {icon}
                    </Button>
                </Tooltip>}
            {(!showEditor || property.secret) &&
                <TextInput className="text-field" isRequired ref={ref}
                           type={property.secret && !showPassword ? "password" : "text"}
                           id={id} name={id}
                           value={textValue !== undefined ? textValue : property.defaultValue}
                           onBlur={_ => parametersChanged(property.name, textValue, property.kind === 'path')}
                           onChange={(_, v) => {
                               setTextValue(v);
                               setCheckChanges(true);
                           }}
               />
            }
            <InputGroupItem>
                <Tooltip position="bottom-end" content={"Show Editor"}>
                    <Button variant="control" onClick={e => setShowEditor(!showEditor)}>
                        <EditorIcon/>
                    </Button>
                </Tooltip>
            </InputGroupItem>
            {showEditor && <InputGroupItem>
                <ExpressionModalEditor name={property.name}
                                       customCode={value}
                                       showEditor={showEditor}
                                       dark={dark}
                                       dslLanguage={undefined}
                                       title={property.displayName}
                                       onClose={() => setShowEditor(false)}
                                       onSave={(fieldId, value1) => {
                                 setTextValue(value1);
                                 parametersChanged(property.name, value1, property.kind === 'path')
                                 setShowEditor(false);
                                 setCheckChanges(false);
                             }}/>
            </InputGroupItem>}
            {property.secret &&
                <Tooltip position="bottom-end" content={showPassword ? "Hide" : "Show"}>
                    <Button variant="control" onClick={e => setShowPassword(!showPassword)}>
                        {showPassword ? <ShowIcon/> : <HideIcon/>}
                    </Button>
                </Tooltip>
            }
            <InputGroupItem>
                <PropertyPlaceholderDropdown property={property} value={value} onComponentPropertyChange={(parameter, v) => {
                    onParametersChange(parameter, v);
                    setTextValue(v);
                    setCheckChanges(false);
                }}/>
            </InputGroupItem>
        </InputGroup>
    }

    function getSpecialStringInput(property: ComponentProperty) {
        return (
            <InputGroup>
                <InputGroupItem isFill>
                    <TextInput
                        className="text-field" isRequired
                        type={(property.secret ? "password" : "text")}
                        id={id} name={id}
                        value={textValue !== undefined ? textValue : property.defaultValue}
                        onBlur={_ => parametersChanged(property.name, textValue, property.kind === 'path')}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                        customIcon={<Text component={TextVariants.p}>{property.type}</Text>}
                    />
                </InputGroupItem>
                <InputGroupItem>
                    <PropertyPlaceholderDropdown property={property} value={textValue} onComponentPropertyChange={(_, v) => {
                        setTextValue(v);
                        onParametersChange(property.name, v)
                        setCheckChanges(true);
                    }}/>
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
            <TextInputGroup className="input-group">
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
                        id={property.name + "-placeholder"}
                        name={property.name + "-placeholder"}
                        type="text"
                        aria-label="placeholder"
                        value={!isValueBoolean ? textValue?.toString() : undefined}
                        onBlur={_ => onParametersChange(property.name, textValue)}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                    />
                </InputGroupItem>
                <InputGroupItem>
                    <PropertyPlaceholderDropdown property={property} value={value} onDslPropertyChange={(_, v) => {
                        setTextValue(v);
                        onParametersChange(property.name, v);
                        setCheckChanges(false);
                    }}/>
                </InputGroupItem>
            </TextInputGroup>
        )
    }

    const property: ComponentProperty = props.property;
    const value = props.value;
    return (
        <FormGroup
            key={id}
            label={property.displayName}
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
            {['string', 'object'].includes(property.type) && property.enum
                && getSelect(property, value)}
            {property.type === 'boolean'
                && getSwitch(property)}
            {getInfrastructureSelectorModal()}
        </FormGroup>
    )
}
