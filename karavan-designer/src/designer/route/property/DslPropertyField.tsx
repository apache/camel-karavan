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
import React from 'react';
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
	capitalize, InputGroupItem
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
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {ExpressionField} from "./ExpressionField";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {ComponentParameterField} from "./ComponentParameterField";
import {DataFormatDefinition} from "karavan-core/lib/model/CamelDefinition";
import {Integration, CamelElement} from "karavan-core/lib/model/IntegrationDefinition";
import {KameletPropertyField} from "./KameletPropertyField";
import {ExpressionDefinition} from "karavan-core/lib/model/CamelDefinition";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {ObjectField} from "./ObjectField";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";
import {MediaTypes} from "../../utils/MediaTypes";
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import CompressIcon from "@patternfly/react-icons/dist/js/icons/compress-icon";
import ExpandIcon from "@patternfly/react-icons/dist/js/icons/expand-icon";
import KubernetesIcon from "@patternfly/react-icons/dist/js/icons/openshift-icon";
import {InfrastructureSelector} from "./InfrastructureSelector";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import EditorIcon from "@patternfly/react-icons/dist/js/icons/code-icon";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";
import {ModalEditor} from "./ModalEditor";
import {KaravanInstance} from "../../KaravanDesigner";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";

interface Props {
    property: PropertyMeta,
    value: any,
    onChange?: (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) => void,
    onExpressionChange?: (propertyName: string, exp: ExpressionDefinition) => void,
    onDataFormatChange?: (value: DataFormatDefinition) => void,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => void,
    element?: CamelElement
    integration: Integration,
    hideLabel?: boolean,
    dslLanguage?: [string, string, string],
    dark: boolean
}

interface State {
    selectStatus: Map<string, boolean>,
    isShowAdvanced: Map<string, boolean>,
    arrayValues: Map<string, string>,
    showEditor: boolean
    infrastructureSelector: boolean
    infrastructureSelectorProperty?: string
    customCode?: string
    ref: any
}

export class DslPropertyField extends React.Component<Props, State> {

    public state: State = {
        selectStatus: new Map<string, boolean>(),
        arrayValues: new Map<string, string>(),
        isShowAdvanced: new Map<string, boolean>(),
        showEditor: false,
        infrastructureSelector: false,
        ref: React.createRef(),
    };

    openSelect = (propertyName: string, isExpanded: boolean) => {
        this.setState({selectStatus: new Map<string, boolean>([[propertyName, isExpanded]])});
    }

    clearSelection = (propertyName: string) => {
        this.setState({selectStatus: new Map<string, boolean>([[propertyName, false]])});
    };

    isSelectOpen = (propertyName: string): boolean => {
        return this.state.selectStatus.has(propertyName) && this.state.selectStatus.get(propertyName) === true;
    }

    propertyChanged = (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) => {
        if (fieldId === 'id' && CamelDefinitionApiExt.hasElementWithId(this.props.integration, value)) {
            value = this.props.value;
        }
        this.props.onChange?.call(this, fieldId, value, newRoute);
        this.setState({selectStatus: new Map<string, boolean>([[fieldId, false]])});
    }

    arrayChanged = (fieldId: string, value: string) => {
        const tv = this.state.arrayValues;
        tv.set(fieldId, value);
        this.setState({arrayValues: tv});
    }

    arrayDeleteValue = (fieldId: string, element: string) => {
        const property: PropertyMeta = this.props.property;
        let value = this.props.value;
        if (property.isArray && property.type === 'string') {
            this.propertyChanged(fieldId, (value as any).filter((x: string) => x !== element))
        }
    }

    arraySave = (fieldId: string) => {
        const newValue = this.state.arrayValues.get(fieldId);
        const property: PropertyMeta = this.props.property;
        let value = this.props.value;
        if (newValue !== undefined && newValue.length > 0 && property.isArray && property.type === 'string') {
            if (value) (value as any).push(newValue)
            else value = [newValue];
        }
        this.propertyChanged(fieldId, value);
        this.arrayChanged(fieldId, "");
    }

    getLabel = (property: PropertyMeta, value: any) => {
        if (!this.isMultiValueField(property) && property.isObject && !property.isArray && !["ExpressionDefinition"].includes(property.type)) {
            const tooltip = value ? "Delete " + property.name : "Add " + property.name;
            const className = value ? "change-button delete-button" : "change-button add-button";
            const x = value ? undefined : CamelDefinitionApi.createStep(property.type, {});
            const icon = value ? (<DeleteIcon />) : (<AddIcon />);
            return (
                <div style={{display: "flex"}}>
                    <Text>{property.displayName} </Text>
                    <Tooltip position={"top"} content={<div>{tooltip}</div>}>
                        <button className={className} onClick={e => this.props.onChange?.call(this, property.name, x)} aria-label="Add element">
                            {icon}
                        </button>
                    </Tooltip>
                </div>
            )
        } else if (!["ExpressionDefinition"].includes(property.type)) {
            return CamelUtil.capitalizeName(property.displayName);
        }
    }

    isUriReadOnly = (property: PropertyMeta): boolean => {
        const dslName: string = this.props.element?.dslName || '';
        return property.name === 'uri' && !['ToDynamicDefinition', 'WireTapDefinition'].includes(dslName)
    }

    selectInfrastructure = (value: string) => {
        // check if there is a selection
        const textVal = this.state.ref.current;
        const cursorStart = textVal.selectionStart;
        const cursorEnd = textVal.selectionEnd;
        if (cursorStart !== cursorEnd) {
            const prevValue = this.props.value;
            const selectedText = prevValue.substring(cursorStart, cursorEnd)
            value = prevValue.replace(selectedText, value);
        }
        const propertyName = this.state.infrastructureSelectorProperty;
        if (propertyName) {
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            this.propertyChanged(propertyName, value);
            this.setState({infrastructureSelector: false, infrastructureSelectorProperty: undefined})
        }
    }

    openInfrastructureSelector = (propertyName: string) => {
        this.setState({infrastructureSelectorProperty: propertyName, infrastructureSelector: true});
    }

    closeInfrastructureSelector = () => {
        this.setState({infrastructureSelector: false})
    }

    getInfrastructureSelectorModal() {
        return (
            <InfrastructureSelector
                dark={false}
                isOpen={this.state.infrastructureSelector}
                onClose={() => this.closeInfrastructureSelector()}
                onSelect={this.selectInfrastructure}/>)
    }

    getStringInput = (property: PropertyMeta, value: any) => {
        const showEditor = this.state.showEditor;
        const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.name);
        const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? <KubernetesIcon/> : <DockerIcon/>
        return (<InputGroup>
            {inInfrastructure && !showEditor && !noInfraSelectorButton &&
                <Tooltip position="bottom-end" content={"Select from " + capitalize(InfrastructureAPI.infrastructure)}>
                    <Button variant="control" onClick={e => this.openInfrastructureSelector(property.name)}>
                        {icon}
                    </Button>
                </Tooltip>}
            {(!showEditor || property.secret) && <TextInput
                ref={this.state.ref}
                className="text-field" isRequired 
                type={['integer', 'number'].includes(property.type) ? 'number' : (property.secret ? "password" : "text")}
                id={property.name} name={property.name}
                value={value?.toString()}
                onChange={(_, v) => this.propertyChanged(property.name, ['integer', 'number'].includes(property.type) ? Number(v) : v)}
                readOnlyVariant={this.isUriReadOnly(property) ? "default" : undefined}/>
            }
            {showEditor && !property.secret && <TextArea
                ref={this.state.ref}
                autoResize={true}
                className="text-field" isRequired 
                type="text"
                id={property.name} name={property.name}
                value={value?.toString()}
                onChange={(_, v) => this.propertyChanged(property.name, ['integer', 'number'].includes(property.type) ? Number(v) : v)}
                readOnlyVariant={this.isUriReadOnly(property) ? "default" : undefined}/>
            }
            {!property.secret &&
                <Tooltip position="bottom-end" content={showEditor ? "Change to TextField" : "Change to Text Area"}>
                    <Button variant="control" onClick={e => this.setState({showEditor: !showEditor})}>
                        {showEditor ? <CompressIcon/> : <ExpandIcon/>}
                    </Button>
                </Tooltip>
            }
        </InputGroup>)
    }

    showCode = (name: string, javaType: string) => {
        const {property} = this.props;
        KaravanInstance.getProps().onGetCustomCode.call(this, name, property.javaType).then(value => {
            if (value === undefined) {
                const code = TemplateApi.generateCode(property.javaType, name);
                this.setState({customCode: code, showEditor: true})
            } else {
                this.setState({customCode: value, showEditor: true})
            }
        }).catch(reason => console.log(reason))
    }

    getJavaTypeGeneratedInput = (property: PropertyMeta, value: any) => {
        const {dslLanguage, dark} = this.props;
        const {showEditor, customCode} = this.state;
        return (<InputGroup>
            <InputGroupItem isFill >
                <TextInput
                    ref={this.state.ref}
                    className="text-field" isRequired 
                    type="text"
                    id={property.name} name={property.name}
                    value={value?.toString()}
                    onChange={(_, value) => {
                        this.propertyChanged(property.name, CamelUtil.capitalizeName(value?.replace(/\s/g, '')))
                    }}
                    readOnlyVariant={this.isUriReadOnly(property) ? "default" : undefined}/>
            </InputGroupItem>
            <InputGroupItem><Tooltip position="bottom-end" content={"Create Java Class"}>
                <Button isDisabled={value?.length === 0} variant="control" onClick={e => this.showCode(value, property.javaType)}>
                    <PlusIcon/>
                </Button>
            </Tooltip></InputGroupItem>
            <InputGroupItem><ModalEditor property={property}
                         customCode={customCode}
                         showEditor={showEditor}
                         dark={dark}
                         dslLanguage={dslLanguage}
                         title="Java Class"
                         onClose={() => this.setState({showEditor: false})}
                         onSave={(fieldId, value1) => {
                             this.propertyChanged(fieldId, value);
                             KaravanInstance.getProps().onSaveCustomCode?.call(this, value, value1);
                             this.setState({showEditor: false});
                         }}/></InputGroupItem>
        </InputGroup>)
    }

    getTextArea = (property: PropertyMeta, value: any) => {
        const {dslLanguage, dark} = this.props;
        const {showEditor} = this.state;
        return (
            <InputGroup>
                <InputGroupItem isFill ><TextArea
                    autoResize
                    className="text-field" isRequired
                    type={"text"}
                    id={property.name}
                    name={property.name}
                    height={"100px"}
                    value={value?.toString()}
                    onChange={(_, v) => this.propertyChanged(property.name, v)}/></InputGroupItem>
                <InputGroupItem><Tooltip position="bottom-end" content={"Show Editor"}>
                    <Button variant="control" onClick={e => this.setState({showEditor: !showEditor})}>
                        <EditorIcon/>
                    </Button>
                </Tooltip></InputGroupItem>
                <InputGroupItem><ModalEditor property={property}
                             customCode={value}
                             showEditor={showEditor}
                             dark={dark}
                             dslLanguage={dslLanguage}
                             title={`Expression (${dslLanguage?.[0]})`}
                             onClose={() => this.setState({showEditor: false})}
                             onSave={(fieldId, value1) => {
                                 this.propertyChanged(fieldId, value1);
                                 this.setState({showEditor: false});
                             }}/></InputGroupItem>
            </InputGroup>
        )
    }

    getExpressionField = (property: PropertyMeta, value: any) => {
        return (
            <div className="expression">
                <ExpressionField property={property}
                                 value={value}
                                 onExpressionChange={this.props.onExpressionChange}
                                 integration={this.props.integration}
                                 dark={this.props.dark}/>
            </div>
        )
    }

    getObjectField = (property: PropertyMeta, value: any) => {
        return (
            <div className="object">
                {value && <ObjectField property={property}
                                       value={value}
                                       onPropertyUpdate={this.props.onChange}
                                       integration={this.props.integration}
                                       dark={this.props.dark}/>}
            </div>
        )
    }

    getSwitch = (property: PropertyMeta, value: any) => {
        const isChecked = value !== undefined ? Boolean(value) : Boolean(property.defaultValue !== undefined && property.defaultValue === 'true');
        return (
            <Switch
                id={property.name} name={property.name}
                value={value?.toString()}
                aria-label={property.name}
                isChecked={isChecked}
                onChange={(_, v) => this.propertyChanged(property.name, v)}/>
        )
    }

    getSelectBean = (property: PropertyMeta, value: any) => {
        const selectOptions: JSX.Element[] = [];
        const beans = CamelUi.getBeans(this.props.integration);
        if (beans) {
            selectOptions.push(<SelectOption key={0} value={"Select..."} isPlaceholder/>);
            selectOptions.push(...beans.map((bean) => <SelectOption key={bean.name} value={bean.name} description={bean.type}/>));
        }
        return (
            <Select
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => this.propertyChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isOpen={this.isSelectOpen(property.name)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    getSelect = (property: PropertyMeta, value: any) => {
        const selectOptions: JSX.Element[] = []
        if (property.enumVals && property.enumVals.length > 0) {
            selectOptions.push(<SelectOption key={0} value={"Select " + property.name} isPlaceholder/>);
            selectOptions.push(...property.enumVals.split(',').map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>));
        }
        return (
            <Select
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => this.propertyChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isOpen={this.isSelectOpen(property.name)}
                id={property.name}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    getMediaTypeSelectOptions(filter?: string): JSX.Element [] {
        const options: JSX.Element [] = [
            <SelectOption key={0} value="Select Media Type" isPlaceholder />
        ];
        const mediaTypes: JSX.Element[] =  filter
            ? MediaTypes.filter(mt => mt.includes(filter)).map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>)
            : MediaTypes.map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>);
        options.push(...mediaTypes);
        return options;
    }

    getMediaTypeSelect = (property: PropertyMeta, value: any) => {
        return (
            <Select
                placeholderText="Select Media Type"
                variant={SelectVariant.typeahead}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => this.propertyChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isOpen={this.isSelectOpen(property.name)}
                isCreatable={false}
                isInputFilterPersisted={false}
                onFilter={(e, text) => this.getMediaTypeSelectOptions(text)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {this.getMediaTypeSelectOptions()}
            </Select>
        )
    }

    canBeInternalUri = (property: PropertyMeta, element?: CamelElement): boolean => {
        if (element?.dslName === 'WireTapDefinition' && property.name === 'uri') {
            return true;
        } else if (element?.dslName === 'SagaDefinition' && ['compensation', 'completion'].includes(property.name)) {
            return true;
        } else if (element && ['GetDefinition', 'PostDefinition', 'PutDefinition', 'PatchDefinition', 'DeleteDefinition', 'HeadDefinition'].includes(element?.dslName) && property.name === 'to') {
            return true;
        } else {
            return false;
        }
    }

    canBeMediaType = (property: PropertyMeta, element?: CamelElement): boolean => {
        if (element
            && ['RestDefinition', 'GetDefinition', 'PostDefinition', 'PutDefinition', 'PatchDefinition', 'DeleteDefinition', 'HeadDefinition'].includes(element?.dslName)
            && ['consumes', 'produces'].includes(property.name)) {
            return true;
        } else {
            return false;
        }
    }

    javaTypeGenerated = (property: PropertyMeta): boolean => {
        return property.javaType.length !== 0;
    }

    getInternalUriSelect = (property: PropertyMeta, value: any) => {
        const selectOptions: JSX.Element[] = [];
        const urls = CamelUi.getInternalRouteUris(this.props.integration, "direct");
        urls.push(...CamelUi.getInternalRouteUris(this.props.integration, "seda"));
        if (urls && urls.length > 0) {
            selectOptions.push(...urls.map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>));
        }
        return (
            <Select
                placeholderText="Select or type an URI"
                variant={SelectVariant.typeahead}
                aria-label={property.name}
                onClear={event => this.clearSelection(property.name)}
                onToggle={(_event, isExpanded) => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => {
                    const url = value.toString().split(":");
                    const newRoute = !urls.includes(value.toString()) && (['direct', 'seda'].includes(url[0])) ? new RouteToCreate(url[0], url[1]) : undefined;
                    this.propertyChanged(property.name, (!isPlaceholder ? value : undefined), newRoute)
                }}
                selections={value}
                isOpen={this.isSelectOpen(property.name)}
                isCreatable={true}
                isInputFilterPersisted={true}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    onMultiValueObjectUpdate = (index: number, fieldId: string, value: CamelElement) => {
        const mValue = [...this.props.value];
        mValue[index] = value;
        this.props.onChange?.call(this, fieldId, mValue);
    }

    isKeyValueObject(property: PropertyMeta) {
        const props = CamelDefinitionApiExt.getElementProperties(property.type);
        return props.length === 2 && props.filter(p => p.name === 'key').length === 1 && props.filter(p => p.name === 'value').length === 1;
    }

    getMultiObjectFieldProps(property: PropertyMeta, value: any, v: any, index: number, hideLabel: boolean = false) {
        return (<>
            <div className="object">
                {value && <ObjectField property={property}
                                       hideLabel={hideLabel}
                                       value={v}
                                       onPropertyUpdate={(f, v) => this.onMultiValueObjectUpdate(index, f, v)}
                                       integration={this.props.integration}
                                       dark={this.props.dark}/>}
            </div>
            <Button variant="link" className="delete-button" onClick={e => {
                const v = Array.from(value);
                v.splice(index, 1);
                this.propertyChanged(property.name, v);
            }}><DeleteIcon/></Button>
        </>)
    }

    getMultiValueObjectField = (property: PropertyMeta, value: any) => {
        const isKeyValue = this.isKeyValueObject(property);
        return (
            <div>
                {value && Array.from(value).map((v: any, index: number) => {
                    if (isKeyValue)
                        return <div key={property + "-" + index} className="object-key-value">
                            {this.getMultiObjectFieldProps(property, value, v, index, index > 0)}
                        </div>
                    else
                        return <Card key={property + "-" + index} className="object-value">
                            {this.getMultiObjectFieldProps(property, value, v, index)}
                        </Card>
                })}
                <Button variant="link" className="add-button"
                        onClick={e => this.propertyChanged(property.name, [...value, CamelDefinitionApi.createStep(property.type, {})])}><AddIcon/>{"Add " + property.displayName}
                </Button>
            </div>
        )
    }

    getMultiValueField = (property: PropertyMeta, value: any) => {
        return (
            <div>
                <TextInputGroup className="input-group">
                    <TextInputGroupMain value={this.state.arrayValues.get(property.name)} onChange={(e, v) => this.arrayChanged(property.name, v)} onKeyUp={e => {
                        if (e.key === 'Enter') this.arraySave(property.name)
                    }}>
                        <ChipGroup>
                            {value && Array.from(value).map((v: any, index: number) => (
                                <Chip key={"chip-" + index} className="chip" onClick={() => this.arrayDeleteValue(property.name, v)}>{v.toString()}</Chip>))}
                        </ChipGroup>
                    </TextInputGroupMain>
                    <TextInputGroupUtilities>
                        <Button variant="plain" onClick={e => this.arraySave(property.name)} aria-label="Add element">
                            <PlusIcon/>
                        </Button>
                    </TextInputGroupUtilities>
                </TextInputGroup>
            </div>
        )
    }

    getKameletParameters = () => {
        const element = this.props.element;
        const requiredParameters = CamelUtil.getKameletRequiredParameters(element);
        return (
            <div className="parameters">
                {CamelUtil.getKameletProperties(element).map(property =>
                    <KameletPropertyField
                        key={property.id}
                        property={property}
                        value={CamelDefinitionApiExt.getParametersValue(element, property.id)}
                        required={requiredParameters?.includes(property.id)}
                        onParameterChange={this.props.onParameterChange}
                    />)}
            </div>
        )
    }

    getMainComponentParameters = (properties: ComponentProperty[]) => {
        return (
            <div className="parameters">
                {properties.map(kp => {
                    const value = CamelDefinitionApiExt.getParametersValue(this.props.element, kp.name, kp.kind === 'path');
                    return (<ComponentParameterField
                        key={kp.name}
                        property={kp}
                        element={this.props.element}
                        integration={this.props.integration}
                        value={value}
                        onParameterChange={this.props.onParameterChange}
                    />)
                })}
            </div>
        )
    }

    getExpandableComponentParameters = (properties: ComponentProperty[], label: string) => {
        return (
            <ExpandableSection
                toggleText={label}
                onToggle={(_event, isExpanded) => {
                    this.setState(state => {
                        state.isShowAdvanced.set(label, !state.isShowAdvanced.get(label));
                        return {isShowAdvanced: state.isShowAdvanced};
                    })
                }}
                isExpanded={this.state.isShowAdvanced.has(label) && this.state.isShowAdvanced.get(label)}>
                <div className="parameters">
                    {properties.map(kp =>
                        <ComponentParameterField
                            key={kp.name}
                            property={kp}
                            integration={this.props.integration}
                            value={CamelDefinitionApiExt.getParametersValue(this.props.element, kp.name, kp.kind === 'path')}
                            onParameterChange={this.props.onParameterChange}
                        />
                    )}
                </div>
            </ExpandableSection>
        )
    }

    getLabelIcon = (property: PropertyMeta) => {
        return (
            property.description
                ? <Popover
                    position={"left"}
                    headerContent={property.displayName}
                    bodyContent={property.description}
                    footerContent={
                        <div>
                            {property.defaultValue !== undefined && property.defaultValue.toString().trim().length > 0 && <div>{"Default: " + property.defaultValue}</div>}
                            {property.required && <b>Required</b>}
                        </div>
                    }>
                    <button type="button" aria-label="More info" onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                    }} className="pf-v5-c-form__group-label-help">
                        <HelpIcon />
                    </button>
                </Popover>
                : <div></div>
        )
    }


    isMultiValueField = (property: PropertyMeta): boolean => {
        return ['string'].includes(property.type) && property.name !== 'expression' && property.isArray && !property.enumVals;
    }

    getComponentParameters(property: PropertyMeta) {
        const properties = CamelUtil.getComponentProperties(this.props.element);
        const propertiesMain = properties.filter(p => !p.label.includes("advanced") && !p.label.includes("security") && !p.label.includes("scheduler"));
        const propertiesAdvanced = properties.filter(p => p.label.includes("advanced"));
        const propertiesScheduler = properties.filter(p => p.label.includes("scheduler"));
        const propertiesSecurity = properties.filter(p => p.label.includes("security"));
        return (
            <>
                {property.name === 'parameters' && this.getMainComponentParameters(propertiesMain)}
                {property.name === 'parameters' && this.props.element && propertiesScheduler.length > 0
                    && this.getExpandableComponentParameters(propertiesScheduler, "Scheduler parameters")}
                {property.name === 'parameters' && this.props.element && propertiesSecurity.length > 0
                    && this.getExpandableComponentParameters(propertiesSecurity, "Security parameters")}
                {property.name === 'parameters' && this.props.element && propertiesAdvanced.length > 0
                    && this.getExpandableComponentParameters(propertiesAdvanced, "Advanced parameters")}
            </>
        )
    }

    render() {
        const isKamelet = CamelUtil.isKameletComponent(this.props.element);
        const property: PropertyMeta = this.props.property;
        const value = this.props.value;
        return (
            <div>
                <FormGroup
                    label={this.props.hideLabel ? undefined : this.getLabel(property, value)}
                    isRequired={property.required}
                    labelIcon={this.getLabelIcon(property)}>
                    {value && ["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                        && this.getExpressionField(property, value)}
                    {property.isObject && !property.isArray && !["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                        && this.getObjectField(property, value)}
                    {property.isObject && property.isArray && !this.isMultiValueField(property)
                        && this.getMultiValueObjectField(property, value)}
                    {property.name === 'expression' && property.type === "string" && !property.isArray
                        && this.getTextArea(property, value)}
                    {this.canBeInternalUri(property, this.props.element)
                        && this.getInternalUriSelect(property, value)}
                    {this.canBeMediaType(property, this.props.element)
                        && this.getMediaTypeSelect(property, value)}
                    {this.javaTypeGenerated(property)
                        && this.getJavaTypeGeneratedInput(property, value)}
                    {['string', 'duration', 'integer', 'number'].includes(property.type) && property.name !== 'expression' && !property.name.endsWith("Ref")
                        && !property.isArray && !property.enumVals
                        && !this.canBeInternalUri(property, this.props.element)
                        && !this.canBeMediaType(property, this.props.element)
                        && !this.javaTypeGenerated(property)
                        && this.getStringInput(property, value)}
                    {['string'].includes(property.type) && property.name.endsWith("Ref") && !property.isArray && !property.enumVals
                        && this.getSelectBean(property, value)}
                    {this.isMultiValueField(property)
                        && this.getMultiValueField(property, value)}
                    {property.type === 'boolean'
                        && this.getSwitch(property, value)}
                    {property.enumVals
                        && this.getSelect(property, value)}
                    {isKamelet && property.name === 'parameters' && this.getKameletParameters()}
                    {!isKamelet && property.name === 'parameters' && this.getComponentParameters(property)}
                </FormGroup>
                {this.getInfrastructureSelectorModal()}
            </div>
        )
    }
}
