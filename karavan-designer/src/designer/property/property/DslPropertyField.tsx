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
    ExpandableSection,
    TextArea,
    Chip,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    ChipGroup,
    Button,
    Text,
    Tooltip,
    Card,
    InputGroup,
    SelectOptionProps,
    InputGroupItem,
    TextVariants,
    ValidatedOptions,
    FormHelperText,
    HelperText,
    HelperTextItem,
} from '@patternfly/react-core';
import {
    Select,
    SelectVariant,
    SelectDirection,
    SelectOption
} from '@patternfly/react-core/deprecated';
import '../../karavan.css';
import './DslPropertyField.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelMetadataApi, PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {ExpressionField} from "./ExpressionField";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {ComponentPropertyField} from "./ComponentPropertyField";
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {KameletPropertyField} from "./KameletPropertyField";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {ObjectField} from "./ObjectField";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {MediaTypes} from "../../utils/MediaTypes";
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {ConfigurationSelectorModal} from "./ConfigurationSelectorModal";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import {useDesignerStore, useIntegrationStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {
    DataFormatDefinition,
    ExpressionDefinition,
    BeanFactoryDefinition
} from "karavan-core/lib/model/CamelDefinition";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";
import {BeanProperties} from "./BeanProperties";
import {PropertyPlaceholderDropdown} from "./PropertyPlaceholderDropdown";
import {VariablesDropdown} from "./VariablesDropdown";
import {SpiBeanApi} from "karavan-core/lib/api/SpiBeanApi";
import {SelectField} from "./SelectField";
import {PropertyUtil} from "./PropertyUtil";
import {usePropertiesStore} from "../PropertyStore";
import {Property} from "karavan-core/lib/model/KameletModels";
import {isSensitiveFieldValid} from "../../utils/ValidatorUtils";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import {EventBus} from "../../utils/EventBus";
import CogIcon from "@patternfly/react-icons/dist/js/icons/cog-icon";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

const beanPrefix = "#bean:";
const classPrefix = "#class:";

interface Props {
    property: PropertyMeta,
    element?: CamelElement
    value: any,
    onPropertyChange?: (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) => void,
    onExpressionChange?: (propertyName: string, exp: ExpressionDefinition) => void,
    onDataFormatChange?: (value: DataFormatDefinition) => void,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => void,
    hideLabel?: boolean,
    dslLanguage?: [string, string, string],
    expressionEditor: React.ComponentType<any>;
}

export function DslPropertyField(props: Props) {

    const [integration, setIntegration, files, variables] = useIntegrationStore((s) => [s.integration, s.setIntegration, s.files, s.variables], shallow)
    const [setSelectedStep, beans, selectedStep] = useDesignerStore((s) => [s.setSelectedStep, s.beans, s.selectedStep], shallow)
    const [propertyFilter, changedOnly, requiredOnly, sensitiveOnly] = usePropertiesStore((s) =>
        [s.propertyFilter, s.changedOnly, s.requiredOnly, s.sensitiveOnly], shallow)

    const [isShowAdvanced, setIsShowAdvanced] = useState<string[]>([]);
    const [arrayValues, setArrayValues] = useState<Map<string, string>>(new Map<string, string>());
    const [selectStatus, setSelectStatus] = useState<Map<string, boolean>>(new Map<string, boolean>());
    const [configurationSelector, setConfigurationSelector] = useState<boolean>(false);
    const [configurationSelectorProperty, setConfigurationSelectorProperty] = useState<string | undefined>(undefined);
    const [configurationSelectorDefaultTab, setConfigurationSelectorDefaultTab] = useState<string>('properties');
    const ref = useRef<any>(null);
    const [textValue, setTextValue] = useState<any>();
    const [checkChanges, setCheckChanges] = useState<boolean>(false);

    useEffect(() => {
        setTextValue(value)
    }, [])

    useEffect(() => {
        if (checkChanges) {
            const interval = setInterval(() => {
                if (props.value !== textValue) {
                    propertyChanged(property.name, textValue);
                }
            }, 700);
            return () => {
                clearInterval(interval)
            }
        }
    }, [checkChanges, textValue])

    function openSelect(propertyName: string, isExpanded: boolean) {
        setSelectStatus(new Map<string, boolean>([[propertyName, isExpanded]]))
    }

    function clearSelection(propertyName: string) {
        setSelectStatus(new Map<string, boolean>([[propertyName, false]]))
    }

    function isSelectOpen(propertyName: string): boolean {
        return selectStatus.get(propertyName) === true;
    }

    function propertyChanged(fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) {
        setCheckChanges(false);
        props.onPropertyChange?.(fieldId, value, newRoute);
        clearSelection(fieldId);
    }

    function arrayChanged(fieldId: string, value: string) {
        setArrayValues(prevState => {
            const map: Map<string, string> = new Map<string, string>(prevState);
            map.set(fieldId, value);
            return map;
        })
    }

    function arrayDeleteValue(fieldId: string, element: string) {
        const property: PropertyMeta = props.property;
        let value = props.value;
        if (property.isArray && property.type === 'string') {
            propertyChanged(fieldId, (value as any).filter((x: string) => x !== element))
        }
    }

    function arraySave(fieldId: string) {
        const newValue = arrayValues.get(fieldId);
        const property: PropertyMeta = props.property;
        let value = props.value;
        if (newValue !== undefined && newValue.length > 0 && property.isArray && property.type === 'string') {
            if (value) (value as any).push(newValue)
            else value = [newValue];
        }
        propertyChanged(fieldId, value);
        arrayChanged(fieldId, "");
    }

    function isParameter(property: PropertyMeta): boolean {
        return property.name === 'parameters' || property.description === 'parameters';
    }

    function getLabel(property: PropertyMeta, value: any, isKamelet: boolean) {
        const labelClassName = PropertyUtil.hasDslPropertyValueChanged(property, value) ? 'value-changed-label' : '';
        if (!isMultiValueField(property) && property.isObject && !property.isArray && !["ExpressionDefinition"].includes(property.type)) {
            const tooltip = value ? "Delete " + property.name : "Add " + property.name;
            const className = value ? "change-button delete-button" : "change-button add-button";
            const x = value ? undefined : CamelDefinitionApi.createStep(property.type, {});
            const meta = CamelMetadataApi.getCamelModelMetadataByClassName(property.type);
            const title = meta?.title || property.displayName;
            const icon = value ? (<DeleteIcon/>) : (<AddIcon/>);
            return (
                <div style={{display: "flex"}}>
                    <Text className={labelClassName}>{title}</Text>
                    <Tooltip position={"top"} content={<div>{tooltip}</div>}>
                        <button className={className} onClick={e => props.onPropertyChange?.(property.name, x)}
                                aria-label="Add element">
                            {icon}
                        </button>
                    </Tooltip>
                </div>
            )
        }
        if (isParameter(property)) {
            return isKamelet ? "Kamelet properties:" : isRouteTemplate ? "Parameters:" : "Component properties:";
        } else if (!["ExpressionDefinition"].includes(property.type)) {
            return (
                <div style={{display: "flex", flexDirection: 'row', alignItems: 'center', gap: '3px'}}>
                    <Text className={labelClassName}>{CamelUtil.capitalizeName(property.displayName)}</Text>
                </div>
            )
        }
    }

    function isUriReadOnly(property: PropertyMeta): boolean {
        const dslName: string = props.element?.dslName || '';
        return property.name === 'uri'
            && !['ToDynamicDefinition', 'WireTapDefinition', 'InterceptFromDefinition', 'InterceptSendToEndpointDefinition'].includes(dslName)
    }

    function selectConfiguration(value: string) {
        // check if there is a selection
        const textVal = ref.current;
        if (textVal != null) {
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
                propertyChanged(propertyName, value);
                setConfigurationSelector(false);
                setConfigurationSelectorProperty(undefined);
            }
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
        const {dslLanguage} = props;
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
                    propertyChanged(property.name, value1)
                    setTextValue(value1);
                    closeConfigurationSelector();
                }}
                expressionEditor={props.expressionEditor}
                onSelect={selectConfiguration}/>)
    }

    function getVariableInput(property: PropertyMeta) {
        const varName = textValue?.toString() || '';
        return (
            <VariablesDropdown
                initialValue={varName}
                valueChangedClassName={valueChangedClassName}
                options={variables.map(v => ({value: v, children: v}))}
                onChange={(variableType: string, variableName: string) => {
                    propertyChanged(property.name, variableType.concat(variableName));
                    setTextValue(variableType.concat(variableName));
                }}
            />
        )
    }

    function isNumeric(num: any) {
        return (typeof (num) === 'number' || typeof (num) === "string" && num.trim() !== '') && !isNaN(num as number);
    }

    function getSpecialStringInput(property: PropertyMeta) {
        return (
            <InputGroup className={valueChangedClassName}>
                <InputGroupItem isFill>
                    <TextInput
                        ref={ref}
                        className="text-field" isRequired
                        type={property.secret ? "password" : "text"}
                        autoComplete="off"
                        id={property.name} name={property.name}
                        value={textValue?.toString() || ''}
                        customIcon={property.type !== 'string' ?
                            <Text component={TextVariants.p}>{property.type}</Text> : undefined}
                        onBlur={_ => {
                            if (isNumeric((textValue))) {
                                propertyChanged(property.name, Number(textValue))
                            } else {
                                propertyChanged(property.name, textValue)
                            }
                        }}
                        onFocus={_ => setCheckChanges(true)}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                    />
                </InputGroupItem>
                <InputGroupItem>
                    <PropertyPlaceholderDropdown
                        property={property} value={value}
                        onDslPropertyChange={(_, v, newRoute) => {
                            setTextValue(v);
                            propertyChanged(property.name, v)
                            setCheckChanges(true);
                        }}/>
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getStringInput(property: PropertyMeta) {
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.name);
        const isNumber = ['integer', 'number', 'duration'].includes(property.type);
        const uriReadOnly = isUriReadOnly(property);
        return (
            <InputGroup className={valueChangedClassName}>
                <TextInputGroup className='text-field'>
                    <TextInputGroupMain
                        ref={ref}
                        type={property.secret ? "password" : "text"}
                        autoComplete="off"
                        id={property.name} name={property.name}
                        value={textValue?.toString() || ''}
                        readOnly={uriReadOnly}
                        onBlur={_ => {
                            if (isNumber && isNumeric((textValue))) {
                                propertyChanged(property.name, Number(textValue))
                            } else if (!isNumber) {
                                propertyChanged(property.name, textValue)
                            }
                        }}
                        onFocus={_ => setCheckChanges(true)}
                        onChange={(_, v) => {
                            if (isNumber && isNumeric(v)) {
                                setTextValue(v);
                                setCheckChanges(true);
                            } else if (!isNumber) {
                                setTextValue(v);
                                setCheckChanges(true);
                            }
                        }}
                    />
                    <TextInputGroupUtilities>
                        <Button variant="plain" className='button-clear' onClick={_ => {
                            propertyChanged(property.name, '');
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
        )
    }

    function showCode(name: string, javaType: string) {
        const {property} = props;
        InfrastructureAPI.onGetCustomCode?.(name, property.javaType).then(value => {
            if (value === undefined) {
                const code = TemplateApi.generateCode(property.javaType, name) || '';
                InfrastructureAPI.onSaveCustomCode(name, code, true);
            }
            InfrastructureAPI.onInternalConsumerClick(undefined, undefined, undefined, name + '.java');
        }).catch((reason: any) => console.log(reason))
    }

    function getJavaTypeGeneratedInput(property: PropertyMeta, value: any) {
        const selectOptions: SelectOptionProps[] = [];
        const allBeansByJavaInterface = SpiBeanApi.findByInterfaceType(property.javaType);
        const allBeansJavaTypes: (string | undefined)[] = allBeansByJavaInterface.map(b => b.javaType).filter(b => b !== undefined) || [];
        if (beans) {
            selectOptions.push(...beans.filter(bean => allBeansJavaTypes.includes(bean.type.replace('#class:', ''))).map((bean) => {
                return {value: beanPrefix + bean.name, children: bean.name, description: bean.name}
            }));
            selectOptions.push(...SpiBeanApi.findByInterfaceTypeSimple(property.javaType).map((bean) => {
                    return {
                        value: classPrefix + bean.javaType, children: bean.name, description: bean.description
                    }
                })
            );
        }
        if (value !== undefined && value.length > 0 && selectOptions.filter(o => o.value === value?.toString()).length === 0) {
            selectOptions.push({
                value: value, children: value, description: 'Custom Java Class'
            })
        }
        return (
            <InputGroup className={valueChangedClassName}>
                <InputGroupItem isFill>
                    <SelectField
                        id={property.name}
                        name={property.name}
                        placeholder='Select bean'
                        selectOptions={selectOptions}
                        value={value?.toString()}
                        onChange={(name, value) => propertyChanged(property.name, value)}
                    />
                </InputGroupItem>
                <InputGroupItem>
                    <Tooltip position="bottom-end" content={"Open Java Class"}>
                        <Button isDisabled={value?.length === 0} variant="control"
                                onClick={e => showCode(value, property.javaType)}>
                            <PlusIcon/>
                        </Button>
                    </Tooltip>
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getTextArea(property: PropertyMeta, value: any) {
        return (
            <InputGroup className={valueChangedClassName}>
                <InputGroupItem isFill>
                    <TextArea
                        className="text-field" isRequired
                        type={"text"}
                        id={property.name}
                        name={property.name}
                        height={"100px"}
                        value={textValue?.toString()}
                        onBlur={_ => propertyChanged(property.name, textValue)}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                    />
                </InputGroupItem>
                <InputGroupItem>
                    {getOpenConfigButton(property, 'editor')}
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getExpressionField(property: PropertyMeta, value: any) {
        return (
            <div className="expression">
                <ExpressionField
                    property={property}
                    value={value}
                    expressionEditor={props.expressionEditor}
                    onExpressionChange={props.onExpressionChange}/>
            </div>
        )
    }

    function getObjectField(property: PropertyMeta, value: any) {
        return (
            <div className="object">
                {value && <ObjectField property={property}
                                       value={value}
                                       expressionEditor={props.expressionEditor}
                                       onPropertyUpdate={propertyChanged}/>}
            </div>
        )
    }

    function getBooleanInput(property: PropertyMeta) {
        const isValueBoolean = (textValue?.toString() === 'true' || textValue?.toString() === 'false');
        const isDisabled = textValue?.toString().includes("{") || textValue?.toString().includes("}")
        let isChecked = false;
        if (textValue !== undefined && isValueBoolean) {
            isChecked = Boolean(textValue);
        } else if ((textValue === undefined || textValue.toString().length > 0) && property.defaultValue !== undefined) {
            isChecked = property.defaultValue === 'true';
        }
        return (
            <InputGroup className={"input-group " + valueChangedClassName}>
                <InputGroupItem>
                    <Switch
                        isDisabled={isDisabled}
                        id={property.name + "-switch"}
                        name={property.name + "-switch"}
                        className="switch-placeholder"
                        value={textValue?.toString()}
                        aria-label={property.name}
                        isChecked={isChecked}
                        onChange={(_, v) => {
                            setTextValue(v);
                            propertyChanged(property.name, v);
                            setCheckChanges(false);
                        }}/>
                </InputGroupItem>
                <TextInputGroup className='boolean-text-field'>
                    <TextInputGroupMain
                        ref={ref}
                        id={property.name + "-placeholder"}
                        name={property.name + "-placeholder"}
                        type="text"
                        aria-label="placeholder"
                        value={!isValueBoolean ? textValue?.toString() : ''}
                        onBlur={_ => propertyChanged(property.name, textValue)}
                        onChange={(_, v) => {
                            setTextValue(v);
                            setCheckChanges(true);
                        }}
                    />
                    <TextInputGroupUtilities>
                        <Button variant="plain" className='button-clear' onClick={_ => {
                            propertyChanged(property.name, '');
                            setTextValue('');
                            setCheckChanges(true);
                        }}>
                            <TimesIcon aria-hidden={true}/>
                        </Button>
                    </TextInputGroupUtilities>
                </TextInputGroup>
                <InputGroupItem className=''>
                    {getOpenConfigButton(property)}
                </InputGroupItem>
            </InputGroup>
        )
    }

    function getOpenConfigButton(property: PropertyMeta, configurationSelectorDefaultTab: string = 'properties') {
        if (element?.dslName === 'LogDefinition' && property.name === 'message') {
            configurationSelectorDefaultTab = 'editor'
        }
        return (
            <Tooltip position="bottom-end" content="Open config selector">
                <Button variant="control" className='open-config-buton' onClick={e => {
                    setConfigurationSelectorDefaultTab(configurationSelectorDefaultTab)
                    openConfigurationSelector(property.name)
                }}>
                    <CogIcon style={{fill: 'var(--pf-v5-global--Color--200)'}}/>
                </Button>
            </Tooltip>
        )
    }

    function getSelectBean(property: PropertyMeta, value: any) {
        const selectOptions: JSX.Element[] = [];
        const beans = CamelUi.getBeans(integration);
        if (beans) {
            selectOptions.push(<SelectOption key={0} value={"Select..."} isPlaceholder/>);
            selectOptions.push(...beans.map((bean) =>
                <SelectOption key={bean.name} value={bean.name} description={bean.type}/>));
        }
        return (
            <Select
                className={valueChangedClassName}
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => propertyChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isOpen={isSelectOpen(property.name)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    function getSelect(property: PropertyMeta, value: any) {
        const selectOptions: JSX.Element[] = []
        if (property.enumVals && property.enumVals.length > 0) {
            selectOptions.push(<SelectOption key={0} value={"Select " + property.name} isPlaceholder/>);
            selectOptions.push(...property.enumVals.split(',').map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>));
        }
        return (
            <Select
                className={valueChangedClassName}
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => propertyChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isOpen={isSelectOpen(property.name)}
                id={property.name}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    function getMediaTypeSelectOptions(filter?: string): JSX.Element [] {
        const options: JSX.Element [] = [
            <SelectOption key={0} value="Select Media Type" isPlaceholder/>
        ];
        const mediaTypes: JSX.Element[] = filter
            ? MediaTypes.filter(mt => mt.includes(filter)).map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>)
            : MediaTypes.map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>);
        options.push(...mediaTypes);
        return options;
    }

    function getMediaTypeSelect(property: PropertyMeta, value: any) {
        return (
            <Select
                className={valueChangedClassName}
                placeholderText="Select Media Type"
                variant={SelectVariant.typeahead}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => propertyChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isOpen={isSelectOpen(property.name)}
                isCreatable={false}
                isInputFilterPersisted={false}
                onFilter={(e, text) => getMediaTypeSelectOptions(text)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {getMediaTypeSelectOptions()}
            </Select>
        )
    }

    function canBeInternalUri(property: PropertyMeta, element?: CamelElement): boolean {
        if (element?.dslName === 'WireTapDefinition' && property.name === 'uri') {
            return true;
        } else if (element?.dslName === 'SagaDefinition' && ['compensation', 'completion'].includes(property.name)) {
            return true;
        } else if (element && ['GetDefinition', 'PostDefinition', 'PutDefinition', 'PatchDefinition', 'DeleteDefinition', 'HeadDefinition'].includes(element?.dslName) && property.name === 'to') {
            return true;
        } else if (property.name === 'deadLetterUri') {
            return true;
        } else {
            return false;
        }
    }

    function canBeMediaType(property: PropertyMeta, element?: CamelElement): boolean {
        if (element
            && ['RestDefinition', 'GetDefinition', 'PostDefinition', 'PutDefinition', 'PatchDefinition', 'DeleteDefinition', 'HeadDefinition'].includes(element.dslName)
            && ['consumes', 'produces'].includes(property.name)) {
            return true;
        } else {
            return false;
        }
    }

    function javaTypeGenerated(property: PropertyMeta): boolean {
        return property.javaType.length !== 0;
    }

    function createNewRoute(property: PropertyMeta, value: any): void {
        try {
            if (property.name === 'deadLetterUri' && selectedStep?.dslName === 'RouteConfigurationDefinition') {
                const newRoute = CamelUi.createNewInternalRoute(value);
                propertyChanged(property.name, value, newRoute)
            } else {
                const split: string = value?.toString().split(':');
                InfrastructureAPI.onCreateNewRoute(split[0], 'name', split[1]);
            }
        } catch (error: any) {
            console.error(error);
            EventBus.sendAlert('Error', error?.message, 'danger')
        }
    }

    function getInternalUriSelect(property: PropertyMeta, value: any) {
        const selectOptions: JSX.Element[] = [];
        const uris: string[] = CamelUi.getInternalUris(files, true, true, true);
        if (uris && uris.length > 0) {
            selectOptions.push(...uris.map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>));
        }
        return (
            <InputGroup className={valueChangedClassName} id={property.name} name={property.name}>
                <InputGroupItem isFill>
                    <Select
                        placeholderText="Select or type an URI"
                        variant={SelectVariant.typeahead}
                        aria-label={property.name}
                        onClear={event => propertyChanged(property.name, undefined, undefined)}
                        onToggle={(_event, isExpanded) => {
                            openSelect(property.name, isExpanded)
                        }}
                        onSelect={(e, value, isPlaceholder) => {
                            propertyChanged(property.name, (!isPlaceholder ? value : undefined), undefined)
                        }}
                        selections={value}
                        createText=""
                        isOpen={isSelectOpen(property.name)}
                        isCreatable={true}
                        isInputFilterPersisted={true}
                        aria-labelledby={property.name}
                        direction={SelectDirection.down}
                    >
                        {selectOptions}
                    </Select>
                </InputGroupItem>
                <InputGroupItem>
                    <Tooltip position="bottom-end" content={"Create route"}>
                        <Button isDisabled={value === undefined} variant="control" onClick={e => {
                            if (value) {
                                createNewRoute(property, value);
                            }
                        }}>
                            {<PlusIcon/>}
                        </Button>
                    </Tooltip>
                </InputGroupItem>
            </InputGroup>
        )
    }

    function onMultiValueObjectUpdate(index: number, fieldId: string, value: CamelElement) {
        const mValue = [...props.value];
        mValue[index] = value;
        props.onPropertyChange?.(fieldId, mValue);
    }

    function isKeyValueObject(property: PropertyMeta) {
        const props = CamelDefinitionApiExt.getElementProperties(property.type);
        return props.length === 2 && props.filter(p => p.name === 'key').length === 1 && props.filter(p => p.name === 'value').length === 1;
    }

    function getMultiObjectFieldProps(property: PropertyMeta, value: any, v: any, index: number, hideLabel: boolean = false) {
        return (<>
            <div className="object">
                {v && <ObjectField property={property}
                                   value={v}
                                   hideLabel={hideLabel}
                                   expressionEditor={props.expressionEditor}
                                   onPropertyUpdate={(f, v) => onMultiValueObjectUpdate(index, f, v)}
                />}
            </div>
            <Button variant="link" className="delete-button" onClick={e => {
                const v = Array.from(value);
                v.splice(index, 1);
                propertyChanged(property.name, v);
            }}><DeleteIcon/></Button>
        </>)
    }

    function getMultiValueObjectField(property: PropertyMeta, value: any) {
        const isKeyValue = isKeyValueObject(property);
        return (
            <div>
                {value && Array.from(value).map((v: any, index: number) => {
                    if (isKeyValue)
                        return <div key={property + "-" + index} className="object-key-value">
                            {getMultiObjectFieldProps(property, value, v, index, index > 0)}
                        </div>
                    else
                        return (
                            <Card key={property + "-" + index} className="object-value" isFlat isRounded>
                                {getMultiObjectFieldProps(property, value, v, index)}
                            </Card>
                        )
                })}
                <Button variant="link" className="add-button"
                        onClick={e => {
                            const valArray = value !== null ? [...value] : [];
                            valArray.push(CamelDefinitionApi.createStep(property.type, {}));
                            propertyChanged(property.name, valArray);
                        }}>
                    <AddIcon/>
                    {"Add " + property.displayName}
                </Button>
            </div>
        )
    }

    function getMultiValueField(property: PropertyMeta, value: any) {
        return (
            <div>
                <TextInputGroup className={"input-group " + valueChangedClassName}>
                    <TextInputGroupMain value={arrayValues.get(property.name) || ''}
                                        onChange={(e, v) => arrayChanged(property.name, v)}
                                        onKeyUp={e => {
                                            if (e.key === 'Enter') arraySave(property.name)
                                        }}
                    >
                        <ChipGroup>
                            {value && Array.from(value).map((v: any, index: number) => (
                                <Chip key={"chip-" + index} className="chip"
                                      onClick={() => arrayDeleteValue(property.name, v)}>{v.toString()}</Chip>))}
                        </ChipGroup>
                    </TextInputGroupMain>
                    <TextInputGroupUtilities>
                        <Button variant="plain" onClick={e => arraySave(property.name)} aria-label="Add element">
                            <PlusIcon/>
                        </Button>
                    </TextInputGroupUtilities>
                </TextInputGroup>
            </div>
        )
    }

    function getKameletPropertyValue(property: Property) {
        const element = props.element;
        return CamelDefinitionApiExt.getParametersValue(element, property.id)
    }

    function getFilteredKameletProperties(): Property[] {
        const element = props.element;
        const requiredParameters = CamelUtil.getKameletRequiredParameters(element);
        let properties = CamelUtil.getKameletProperties(element)
        const filter = propertyFilter.toLocaleLowerCase()
        properties = properties.filter(p => p.title?.toLocaleLowerCase().includes(filter) || p.id?.toLocaleLowerCase().includes(filter));
        if (requiredOnly) {
            properties = properties.filter(p => requiredParameters.includes(p.id));
        }
        if (changedOnly) {
            properties = properties.filter(p => PropertyUtil.hasKameletPropertyValueChanged(p, getKameletPropertyValue(p)));
        }
        if (sensitiveOnly) {
            properties = properties.filter(p => p.format == "password");
        }
        return properties;
    }

    function getKameletParameters() {
        const element = props.element;
        const requiredParameters = CamelUtil.getKameletRequiredParameters(element);
        return (
            <div className="parameters">
                {getFilteredKameletProperties().map(property =>
                    <KameletPropertyField
                        key={property.id}
                        property={property}
                        value={getKameletPropertyValue(property)}
                        expressionEditor={props.expressionEditor}
                        required={requiredParameters?.includes(property.id)}
                    />)}
            </div>
        )
    }

    function getComponentPropertyValue(kp: ComponentProperty) {
        const element = props.element;
        return CamelDefinitionApiExt.getParametersValue(element, kp.name, kp.kind === 'path');
    }

    function getMainComponentParameters(properties: ComponentProperty[]) {
        return (
            <div className="parameters">
                {properties.map(kp => {
                    return (<ComponentPropertyField
                        key={kp.name}
                        property={kp}
                        value={getComponentPropertyValue(kp)}
                        element={props.element}
                        expressionEditor={props.expressionEditor}
                        onParameterChange={props.onParameterChange}
                    />)
                })}
            </div>
        )
    }

    function getExpandableComponentProperties(properties: ComponentProperty[], label: string) {
        return (
            <ExpandableSection
                toggleText={label}
                onToggle={(_event, isExpanded) => {
                    setIsShowAdvanced(prevState => {
                        if (isExpanded && !isShowAdvanced.includes(label)) {
                            prevState = [...prevState, label]
                        } else {
                            prevState = prevState.filter(s => s !== label);
                        }
                        return prevState;
                    })
                }}
                isExpanded={getShowExpanded(label)}>
                <div className="parameters">
                    {properties.map(kp =>
                        <ComponentPropertyField
                            key={kp.name}
                            property={kp}
                            value={getComponentPropertyValue(kp)}
                            expressionEditor={props.expressionEditor}
                            onParameterChange={props.onParameterChange}
                        />
                    )}
                </div>
            </ExpandableSection>
        )
    }

    function getLabelIcon(property: PropertyMeta) {
        return (
            property.description
                ? <Popover
                    position={"left"}
                    headerContent={property.displayName}
                    bodyContent={property.description}
                    footerContent={
                        <div>
                            {property.defaultValue !== undefined && property.defaultValue.toString().trim().length > 0 &&
                                <div>{"Default: " + property.defaultValue}</div>}
                            {property.required && <b>Required</b>}
                        </div>
                    }>
                    <button type="button" aria-label="More info" onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                    }} className="pf-v5-c-form__group-label-help">
                        <HelpIcon/>
                    </button>
                </Popover>
                : <div></div>
        )
    }


    function changeBean(bean: BeanFactoryDefinition) {
        const clone = CamelUtil.cloneIntegration(integration);
        const i = CamelDefinitionApiExt.addBeanToIntegration(clone, bean);
        setIntegration(i, false);
        setSelectedStep(bean);
    }

    function getBeanProperties(type: 'constructors' | 'properties') {
        return <BeanProperties type={type} onChange={changeBean} onClone={changeBean} expressionEditor={props.expressionEditor}/>
    }

    function isMultiValueField(property: PropertyMeta): boolean {
        return ['string'].includes(property.type) && property.name !== 'expression' && property.isArray && !property.enumVals;
    }

    function getFilteredComponentProperties(): ComponentProperty[] {
        let componentProperties = CamelUtil.getComponentProperties(element);
        const filter = propertyFilter.toLocaleLowerCase()
        componentProperties = componentProperties.filter(p => p.name?.toLocaleLowerCase().includes(filter) || p.label.toLocaleLowerCase().includes(filter) || p.displayName.toLocaleLowerCase().includes(filter));
        if (requiredOnly) {
            componentProperties = componentProperties.filter(p => p.required);
        }
        if (changedOnly) {
            componentProperties = componentProperties.filter(p => PropertyUtil.hasComponentPropertyValueChanged(p, getComponentPropertyValue(p)));
        }
        if (sensitiveOnly) {
            componentProperties = componentProperties.filter(p => p.secret);
        }
        return componentProperties
    }

    function getPropertySelectorChanged(): boolean {
        return requiredOnly || changedOnly || propertyFilter?.trim().length > 0;
    }

    function getShowExpanded(label: string): boolean {
        return isShowAdvanced.includes(label) || getPropertySelectorChanged();
    }

    function getComponentParameters(property: PropertyMeta) {
        const element = props.element;
        const properties = getFilteredComponentProperties();
        const propertiesMain = properties.filter(p => !p.label.includes("advanced") && !p.label.includes("security") && !p.label.includes("scheduler"));
        const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));
        const propertiesScheduler = properties.filter(p => p.label.includes("scheduler"));
        const propertiesSecurity = properties.filter(p => p.label.includes("security"));
        return (
            <>
                {property.name === 'parameters' && getMainComponentParameters(propertiesMain)}
                {property.name === 'parameters' && element && propertiesScheduler.length > 0
                    && getExpandableComponentProperties(propertiesScheduler, "Component scheduler properties")}
                {property.name === 'parameters' && element && propertiesSecurity.length > 0
                    && getExpandableComponentProperties(propertiesSecurity, "Component security properties")}
                {property.name === 'parameters' && element && propertiesAdvanced.length > 0
                    && getExpandableComponentProperties(propertiesAdvanced, "Component advanced properties")}
            </>
        )
    }

    function getIsVariable() {
        if (['variableSend', 'variableReceive'].includes(property.name)) {
            return true;
        } else if (property.name === 'name' && element?.dslName === 'SetVariableDefinition') {
            return true;
        } else if (property.name === 'name' && element?.dslName === 'RemoveVariableDefinition') {
            return true
        } else if (['name', 'toName'].includes(property.name) && element?.dslName === 'ConvertVariableDefinition') {
            return true;
        }
        return false;
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

    const element = props.element;
    const isKamelet = CamelUtil.isKameletComponent(element);
    const isRouteTemplate = element?.dslName === 'RouteTemplateDefinition';
    const property: PropertyMeta = props.property;
    const value = props.value;
    const validated = (property.secret && !isSensitiveFieldValid(value)) ? ValidatedOptions.error : ValidatedOptions.default;
    const isVariable = getIsVariable();
    const beanConstructors = element?.dslName === 'BeanFactoryDefinition' && property.name === 'constructors'
    const beanProperties = element?.dslName === 'BeanFactoryDefinition' && property.name === 'properties'
    const isSpi = property.javaType.startsWith("org.apache.camel.spi") || property.javaType.startsWith("org.apache.camel.AggregationStrategy");
    const valueChangedClassName = PropertyUtil.hasDslPropertyValueChanged(property, value) ? 'value-changed' : '';
    return (
        <>
            <FormGroup
                className='dsl-property-form-group'
                label={props.hideLabel ? undefined : getLabel(property, value, isKamelet)}
                isRequired={property.required}
                labelIcon={isParameter(property) ? undefined : getLabelIcon(property)}>
                {value !== undefined && ["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                    && getExpressionField(property, value)}
                {property.isObject && !property.isArray && !["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                    && getObjectField(property, value)}
                {property.isObject && property.isArray && !isMultiValueField(property)
                    && getMultiValueObjectField(property, value)}
                {property.name === 'expression' && property.type === "string" && !property.isArray
                    && getTextArea(property, value)}
                {canBeInternalUri(property, element)
                    && getInternalUriSelect(property, value)}
                {canBeMediaType(property, element)
                    && getMediaTypeSelect(property, value)}
                {javaTypeGenerated(property)
                    && getJavaTypeGeneratedInput(property, value)}
                {['duration', 'integer', 'number'].includes(property.type)
                    && !isVariable
                    && property.name !== 'expression'
                    && !property.name.endsWith("Ref")
                    && !property.isArray && !property.enumVals
                    && !canBeInternalUri(property, element)
                    && !canBeMediaType(property, element)
                    && !javaTypeGenerated(property)
                    && getSpecialStringInput(property)}
                {['string'].includes(property.type)
                    && !isVariable
                    && property.name !== 'expression'
                    && !property.name.endsWith("Ref")
                    && !property.isArray && !property.enumVals
                    && !canBeInternalUri(property, element)
                    && !canBeMediaType(property, element)
                    && !javaTypeGenerated(property)
                    && getStringInput(property)}
                {isVariable && getVariableInput(property)}
                {['string'].includes(property.type) && property.name.endsWith("Ref") && !property.isArray && !property.enumVals
                    && getSelectBean(property, value)}
                {isMultiValueField(property)
                    && getMultiValueField(property, value)}
                {property.type === 'boolean'
                    && getBooleanInput(property)}
                {property.enumVals
                    && getSelect(property, value)}
                {isKamelet && property.name === 'parameters' && getKameletParameters()}
                {!isKamelet && property.name === 'parameters' && getComponentParameters(property)}
                {beanConstructors && getBeanProperties('constructors')}
                {beanProperties && getBeanProperties('properties')}
                {getValidationHelper()}
            </FormGroup>
            {getConfigurationSelectorModal()}
        </>
    )
}