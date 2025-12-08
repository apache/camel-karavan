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
    ExpandableSection,
    FormGroup,
    FormGroupLabelHelp,
    FormHelperText,
    HelperText,
    HelperTextItem,
    InputGroup,
    InputGroupItem,
    Label,
    LabelGroup,
    Popover,
    SelectOptionProps,
    Switch,
    TextArea,
    TextInput,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    Tooltip,
    ValidatedOptions
} from '@patternfly/react-core';
import './DslPropertyField.css';
import {CogIcon, ExclamationCircleIcon, PlusCircleIcon, PlusIcon, TimesCircleIcon, TimesIcon} from '@patternfly/react-icons';
import {CamelUtil} from "@karavan-core/api/CamelUtil";
import {CamelMetadataApi, PropertyMeta} from "@karavan-core/model/CamelMetadata";
import {CamelDefinitionApiExt} from "@karavan-core/api/CamelDefinitionApiExt";
import {ExpressionField} from "./ExpressionField";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {ComponentPropertyField} from "./ComponentPropertyField";
import {CamelElement} from "@karavan-core/model/IntegrationDefinition";
import {KameletPropertyField} from "./KameletPropertyField";
import {ObjectField} from "./ObjectField";
import {CamelDefinitionApi} from "@karavan-core/api/CamelDefinitionApi";
import {ComponentProperty} from "@karavan-core/model/ComponentModels";
import {ConfigurationSelectorModal} from "./ConfigurationSelectorModal";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import {shallow} from "zustand/shallow";
import {BeanFactoryDefinition, DataFormatDefinition, ExpressionDefinition} from "@karavan-core/model/CamelDefinition";
import {TemplateApi} from "@karavan-core/api/TemplateApi";
import {BeanProperties} from "./BeanProperties";
import {PropertyPlaceholderDropdown} from "./PropertyPlaceholderDropdown";
import {VariablesDropdown} from "./VariablesDropdown";
import {SpiBeanApi} from "@karavan-core/api/SpiBeanApi";
import {PropertyUtil} from "./PropertyUtil";
import {usePropertiesStore} from "../PropertyStore";
import {Property} from "@karavan-core/model/KameletModels";
import {isSensitiveFieldValid} from "../../utils/ValidatorUtils";
import {EventBus} from "../../utils/EventBus";
import {CamelDefaultStepProperty} from "../../utils/CamelDefaultStepProperty";
import {useDesignerStore, useIntegrationStore} from "@features/integration/designer/DesignerStore";
import {DslPropertyFieldSelect} from "@features/integration/designer/property/property/DslPropertyFieldSelect";
import {MEDIA_TYPES} from "@features/integration/designer/utils/MediaTypes";
import {DslPropertyFieldSelectScrollable} from "@features/integration/designer/property/property/DslPropertyFieldSelectScrollable";
import {FieldSelectWithCreate} from "@shared/ui/FieldSelectWithCreate";
import {FileReferenceDropdown} from "@features/integration/designer/property/property/FileReferenceDropdown";

const beanPrefix = "#bean:";
const classPrefix = "#class:";
const filePrefix = 'resource:';

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

    const {property, element, value, onPropertyChange, onExpressionChange, onDataFormatChange, onParameterChange, hideLabel, dslLanguage, expressionEditor} = props;

    const [integration, setIntegration, files, variables] = useIntegrationStore((s) => [s.integration, s.setIntegration, s.files, s.variables], shallow)
    const [setSelectedStep, beans, selectedStep, stepDoubleClicked, setStepDoubleClicked] = useDesignerStore((s) => [s.setSelectedStep, s.beans, s.selectedStep, s.stepDoubleClicked, s.setStepDoubleClicked], shallow)
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
    const labelHelpRef = useRef(null);

    useEffect(() => {
        setTextValue(value)
    }, [])

    useEffect(() => {
        if (stepDoubleClicked && selectedStep) {
            const dsp = CamelDefaultStepProperty.findDslDefaultProperty(selectedStep.dslName);
            if (dsp?.propertyName === property.name) {
                if (dsp.isExpression && dslLanguage) {
                    setConfigurationSelectorDefaultTab(dsp.tab)
                    openConfigurationSelector(property.name);
                }
            }
            setStepDoubleClicked(false)
        }
    }, [stepDoubleClicked])

    useEffect(() => {
        if (checkChanges) {
            const interval = setInterval(() => {
                if (value !== textValue) {
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
        onPropertyChange?.(fieldId, value, newRoute);
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
        const p: PropertyMeta = property;
        let v = value;
        if (p.isArray && p.type === 'string') {
            propertyChanged(fieldId, (v as any).filter((x: string) => x !== element))
        }
    }

    function arraySave(fieldId: string) {
        const newValue = arrayValues.get(fieldId);
        const p: PropertyMeta = property;
        let v = value;
        if (newValue !== undefined && newValue.length > 0 && p.isArray && p.type === 'string') {
            if (v) (v as any).push(newValue)
            else v = [newValue];
        }
        propertyChanged(fieldId, v);
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
            const icon = value ? (<TimesCircleIcon/>) : (<PlusCircleIcon/>);
            return (
                <div style={{display: "flex"}}>
                    <Content component="p" className={labelClassName}>{title}</Content>
                    <Tooltip position={"top"} content={<div>{tooltip}</div>}>
                        <button className={className} onClick={e => onPropertyChange?.(property.name, x)}
                                aria-label="Add element">
                            {icon}
                        </button>
                    </Tooltip>
                </div>
            )
        }
        if (isParameter(property)) {
            return isKamelet ? "Kamelet properties:" : isRouteTemplate ? "Parameters:" : "Component parameters:";
        } else if (!["ExpressionDefinition"].includes(property.type)) {
            return (
                <div style={{display: "flex", flexDirection: 'row', alignItems: 'center', gap: '3px'}}>
                    <Content component="p" className={labelClassName}>{CamelUtil.capitalizeName(property.displayName)}</Content>
                </div>
            )
        }
    }

    function isUriReadOnly(property: PropertyMeta): boolean {
        const dslName: string = element?.dslName || '';
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
                const prevValue = value;
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
                expressionEditor={expressionEditor}
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
                            <Content component={ContentVariants.p}>{property.type}</Content> : undefined}
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
                        <Button icon={<TimesIcon aria-hidden={true}/>} variant="plain" className='button-clear' onClick={_ => {
                            propertyChanged(property.name, '');
                            setTextValue('');
                            setCheckChanges(true);
                        }}/>
                        {!noInfraSelectorButton && getOpenConfigButton(property)}
                    </TextInputGroupUtilities>
                </TextInputGroup>
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
        }).catch((reason: any) => console.error(reason))
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
        files?.filter(f => f.name.endsWith('.java')).forEach((f) => {
            const name = f.name.replace('.java', '');
            selectOptions.push({value: name, children: name, description: 'Custom Java Class'})
        });
        return <DslPropertyFieldSelect
            value={value?.toString()}
            property={property}
            selectOptions={selectOptions}
            placeholder='Select bean'
            onPropertyChange={(_, val) => propertyChanged(property.name, val)}
            utilities={[
                <Tooltip position="bottom-end" content={"Open Java Class"}>
                    <Button icon={<PlusIcon/>} isDisabled={value === undefined || value?.length === 0} variant="plain"
                            onClick={e => showCode(value, property.javaType)}>
                    </Button>
                </Tooltip>
            ]}
        />
    }

    function onFileReferenceClick(text: string) {
        const inputLanguage = dslLanguage?.[0];
        const filename = text?.replace(filePrefix, '');
        if (text?.startsWith(filePrefix) && text?.endsWith("." + inputLanguage) && !files.find(f => f.name === filename)) {
            InfrastructureAPI.onCreateNewFile(filename, "", true)
        } else {
            InfrastructureAPI.onInternalConsumerClick(undefined, undefined, undefined, filename)
        }
    }

    function getExpressionFieldEditor(property: PropertyMeta, value: any) {
        const isNull: boolean = value === undefined || value === null || value?.toString().trim() === '';
        const isResource: boolean = isNull || value?.startsWith(filePrefix);
        const isText: boolean = isNull || !value?.startsWith(filePrefix);

        const inputLanguage = dslLanguage?.[0];
        const options: SelectOptionProps[] = files
            .filter(f => !inputLanguage || f.name.endsWith(inputLanguage))
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
                            onBlur={_ => propertyChanged(property.name, textValue)}
                            placeholder={`Type ${inputLanguage} expression`}
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
                        placeholder={`Select or Create expression file (.${inputLanguage})`}
                        valueChangedClassName={valueChangedClassName}
                        inputLanguage={inputLanguage}
                        options={options}
                        additionalItems={additionalItems}
                        onChange={(text: string) => {
                            if (text?.endsWith(`.${inputLanguage}`)) {
                                const filename = text?.replace(filePrefix, '');
                                setTextValue(`${filePrefix}${filename}`);
                            } else if (text?.trim().length === 0) {
                                setTextValue(text)
                            }
                            setCheckChanges(true);
                        }}
                        onFileReferenceClick={onFileReferenceClick}
                    />
                }
            </div>
        )
    }

    function getExpressionField(property: PropertyMeta, value: any) {
        return (
            <div className="expression">
                <ExpressionField
                    property={property}
                    value={value}
                    expressionEditor={expressionEditor}
                    onExpressionChange={onExpressionChange}/>
            </div>
        )
    }

    function getObjectField(property: PropertyMeta, value: any) {
        return (
            <div className="object">
                {value && <ObjectField property={property}
                                       value={value}
                                       expressionEditor={expressionEditor}
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
                        <Button icon={<TimesIcon aria-hidden={true}/>} variant="plain" className='button-clear' onClick={_ => {
                            propertyChanged(property.name, '');
                            setTextValue('');
                            setCheckChanges(true);
                        }}/>
                    </TextInputGroupUtilities>
                    {getOpenConfigButton(property)}
                </TextInputGroup>
            </InputGroup>
        )
    }

    function getOpenConfigButton(property: PropertyMeta, configurationSelectorDefaultTab: string = 'properties') {
        if (element?.dslName === 'LogDefinition' && property.name === 'message') {
            configurationSelectorDefaultTab = 'editor'
        }
        return (
            <Tooltip position="bottom-end" content="Open config selector">
                <Button icon={<CogIcon/>} variant="plain" className='open-config-buton' onClick={e => {
                    setConfigurationSelectorDefaultTab(configurationSelectorDefaultTab)
                    openConfigurationSelector(property.name)
                }}>
                </Button>
            </Tooltip>
        )
    }

    function getSelectBean(property: PropertyMeta, value: any) {
        const selectOptions: SelectOptionProps[] = [];
        if (beans) {
            selectOptions.push(...beans.map((bean) => ({key: value, value: bean.name, description: bean.type, children: bean.name})));
        }
        return <DslPropertyFieldSelect value={value}
                                       property={property}
                                       selectOptions={selectOptions}
                                       onPropertyChange={(_, val) => propertyChanged(property.name, val)}
        />
    }

    function getSelect(property: PropertyMeta, value: any) {
        const selectOptions: SelectOptionProps[] = []
        if (property.enumVals && property.enumVals.length > 0) {
            selectOptions.push(...property.enumVals.split(',').map((enumVal: string) => {
                const textValue: string = enumVal?.trim();
                return ({key: textValue, value: textValue, children: textValue})
            }));
        }
        return <DslPropertyFieldSelect value={value}
                                       property={property}
                                       selectOptions={selectOptions}
                                       onPropertyChange={(_, val) => propertyChanged(property.name, val)}
        />
    }

    function getMediaTypeSelectOptions(filter?: string): SelectOptionProps [] {
        const options: SelectOptionProps [] = [];
        const mediaTypes: SelectOptionProps[] = filter
            ? MEDIA_TYPES.filter(mt => mt.includes(filter)).map((value: string) =>
                ({value: value.trim(), children: value.trim(), description: value.trim()}))
            : MEDIA_TYPES.map((value: string) =>
                ({value: value.trim(), children: value.trim(), description: value.trim()}))
        options.push(...mediaTypes);
        return options;
    }

    function getMediaTypeSelect(property: PropertyMeta, value: any) {
        return <DslPropertyFieldSelectScrollable
            value={value}
            property={property}
            selectOptions={getMediaTypeSelectOptions()}
            placeholder='Select Media Type'
            onPropertyChange={(_, val) => propertyChanged(property.name, val)}
        />
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
                const componentName = split[0];
                const propertyName = componentName === 'vertx' ? 'address' : 'name';
                InfrastructureAPI.onCreateNewRoute(componentName, propertyName, split[1]);
            }
        } catch (error: any) {
            console.error(error);
            EventBus.sendAlert('Error', error?.message, 'danger')
        }
    }

    function getInternalUriSelect() {
        const uris: string[] = CamelUi.getInternalUris(files, true, true, true);
        return (
            <FieldSelectWithCreate
                placeholder={'Select a URI'}
                listOfValues={[...uris]}
                onSelectElement={selectedValue => propertyChanged(property.name, selectedValue)}
                value={value}
                className={valueChangedClassName}
                utilities={[
                    <Tooltip key={'1'} position="bottom-end" content={"Create route"}>
                        <Button isDisabled={value === undefined} variant="plain" onClick={e => {
                            if (value) {
                                createNewRoute(property, value);
                            }
                        }}>
                            {<PlusIcon/>}
                        </Button>
                    </Tooltip>
                ]}
            />
        )
    }

    function onMultiValueObjectUpdate(index: number, fieldId: string, v: CamelElement) {
        const mValue = [...value];
        mValue[index] = v;
        onPropertyChange?.(fieldId, mValue);
    }

    function isKeyValueObject(property: PropertyMeta) {
        const propertiesMetadata = CamelDefinitionApiExt.getElementProperties(property.type);
        return propertiesMetadata.length === 2 && propertiesMetadata.filter(p => p.name === 'key').length === 1 && propertiesMetadata.filter(p => p.name === 'value').length === 1;
    }

    function getMultiObjectFieldProps(property: PropertyMeta, value: any, v: any, index: number, hideLabel: boolean = false) {
        return (<>
            <div className="object">
                {v && <ObjectField property={property}
                                   value={v}
                                   hideLabel={hideLabel}
                                   expressionEditor={expressionEditor}
                                   onPropertyUpdate={(f, v) => onMultiValueObjectUpdate(index, f, v)}
                />}
            </div>
            <Button icon={<TimesCircleIcon/>} variant="link" className="delete-button" onClick={e => {
                const v = Array.from(value);
                v.splice(index, 1);
                propertyChanged(property.name, v);
            }}></Button>
        </>)
    }

    function getMultiValueObjectField(property: PropertyMeta, value: any) {
        const isKeyValue = isKeyValueObject(property);
        return (
            <div style={{display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'flex-start', alignItems: 'stretch'}}>
                {value && Array.from(value).map((v: any, index: number) => {
                    if (isKeyValue)
                        return <div key={property + "-" + index} className="object-key-value">
                            {getMultiObjectFieldProps(property, value, v, index, index > 0)}
                        </div>
                    else
                        return (
                            <div key={property + "-" + index} className="object-value">
                                {getMultiObjectFieldProps(property, value, v, index)}
                            </div>
                        )
                })}
                <div>
                    <Button icon={<PlusCircleIcon/>} variant="link" className="add-button"
                            onClick={e => {
                                const valArray = value !== null ? [...value] : [];
                                valArray.push(CamelDefinitionApi.createStep(property.type, {}));
                                propertyChanged(property.name, valArray);
                            }}>

                        {"Add " + property.displayName}
                    </Button>
                </div>
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
                        <LabelGroup>
                            {value && Array.from(value).map((v: any, index: number) => (
                                <Label variant="outline" key={"chip-" + index} className="chip"
                                       onClose={() => arrayDeleteValue(property.name, v)}>{v.toString()}</Label>))}
                        </LabelGroup>
                    </TextInputGroupMain>
                    <TextInputGroupUtilities>
                        <Button icon={<PlusIcon/>} variant="plain" onClick={e => arraySave(property.name)} aria-label="Add element"/>
                    </TextInputGroupUtilities>
                </TextInputGroup>
            </div>
        )
    }

    function getKameletPropertyValue(property: Property) {
        return CamelDefinitionApiExt.getParametersValue(element, property.id)
    }

    function getFilteredKameletProperties(): Property[] {
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
        const requiredParameters = CamelUtil.getKameletRequiredParameters(element);
        return (
            <div className="parameters">
                {getFilteredKameletProperties().map(property =>
                    <KameletPropertyField
                        key={property.id}
                        property={property}
                        value={getKameletPropertyValue(property)}
                        expressionEditor={expressionEditor}
                        required={requiredParameters?.includes(property.id)}
                    />)}
            </div>
        )
    }

    function getComponentPropertyValue(kp: ComponentProperty) {
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
                        element={element}
                        expressionEditor={expressionEditor}
                        onParameterChange={onParameterChange}
                    />)
                })}
            </div>
        )
    }

    function getExpandableComponentParameters(properties: ComponentProperty[], label: string) {
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
                            expressionEditor={expressionEditor}
                            onParameterChange={onParameterChange}
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
                    triggerRef={labelHelpRef}
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
                    <FormGroupLabelHelp ref={labelHelpRef} aria-label="More info"/>
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
        return <BeanProperties type={type} onChange={changeBean} onClone={changeBean} expressionEditor={expressionEditor}/>
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
        const properties = getFilteredComponentProperties();
        const propertiesMain = properties.filter(p => !p.label.includes("advanced") && !p.label.includes("security") && !p.label.includes("scheduler"));
        const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));
        const propertiesScheduler = properties.filter(p => p.label.includes("scheduler"));
        const propertiesSecurity = properties.filter(p => p.label.includes("security"));
        return (
            <>
                {property.name === 'parameters' && getMainComponentParameters(propertiesMain)}
                {property.name === 'parameters' && element && propertiesScheduler.length > 0
                    && getExpandableComponentParameters(propertiesScheduler, "Component scheduler parameters")}
                {property.name === 'parameters' && element && propertiesSecurity.length > 0
                    && getExpandableComponentParameters(propertiesSecurity, "Component security parameters")}
                {property.name === 'parameters' && element && propertiesAdvanced.length > 0
                    && getExpandableComponentParameters(propertiesAdvanced, "Component advanced parameters")}
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

    const isKamelet = CamelUtil.isKameletComponent(element);
    const isRouteTemplate = element?.dslName === 'RouteTemplateDefinition';
    const validated = (property.secret && !isSensitiveFieldValid(value)) ? ValidatedOptions.error : ValidatedOptions.default;
    const isVariable = getIsVariable();
    const beanConstructors = element?.dslName === 'BeanFactoryDefinition' && property.name === 'constructors'
    const beanProperties = element?.dslName === 'BeanFactoryDefinition' && property.name === 'properties'
    const isSpi = property.javaType.startsWith("org.apache.camel.spi") || property.javaType.startsWith("org.apache.camel.AggregationStrategy");
    const valueChangedClassName = PropertyUtil.hasDslPropertyValueChanged(property, value) ? 'value-changed' : '';
    return (
        <FormGroup
            className='dsl-property-form-group'
            label={hideLabel ? undefined : getLabel(property, value, isKamelet)}
            isRequired={property.required}
            labelHelp={isParameter(property) ? undefined : getLabelIcon(property)}>
            {value !== undefined && ["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                && getExpressionField(property, value)}
            {property.isObject && !property.isArray && !["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                && getObjectField(property, value)}
            {property.isObject && property.isArray && !isMultiValueField(property)
                && getMultiValueObjectField(property, value)}
            {property.name === 'expression' && property.type === "string" && !property.isArray
                && getExpressionFieldEditor(property, value)}
            {canBeInternalUri(property, element)
                && getInternalUriSelect()}
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
            {['string'].includes(property.type)
                && property.name.endsWith("Ref")
                && !property.isArray && !property.enumVals
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
            {configurationSelector && getConfigurationSelectorModal()}
        </FormGroup>
    )
}