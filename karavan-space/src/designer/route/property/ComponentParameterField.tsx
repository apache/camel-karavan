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
	InputGroup,
	TextArea,
	Tooltip,
	Button,
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
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {ToDefinition} from "karavan-core/lib/model/CamelDefinition";
import CompressIcon from "@patternfly/react-icons/dist/js/icons/compress-icon";
import ExpandIcon from "@patternfly/react-icons/dist/js/icons/expand-icon";
import {InfrastructureSelector} from "./InfrastructureSelector";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import KubernetesIcon from "@patternfly/react-icons/dist/js/icons/openshift-icon";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";

const prefix = "parameters";
const beanPrefix = "#bean:";

interface Props {
    property: ComponentProperty,
    integration: Integration,
    element?: CamelElement,
    value: any,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => void
}

interface State {
    selectStatus: Map<string, boolean>
    showEditor: boolean
    showPassword: boolean
    showInfrastructureSelector: boolean
    infrastructureSelectorProperty?: string
    ref: any
    id: string
}

export class ComponentParameterField extends React.Component<Props, State> {

    public state: State = {
        selectStatus: new Map<string, boolean>(),
        showEditor: false,
        showPassword: false,
        showInfrastructureSelector: false,
        ref: React.createRef(),
        id: prefix + "-" + this.props.property.name
    }

    parametersChanged = (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => {
        this.props.onParameterChange?.call(this, parameter, value, pathParameter, newRoute);
        this.setState({selectStatus: new Map<string, boolean>([[parameter, false]])});
    }

    openSelect = (propertyName: string, isExpanded: boolean) => {
        this.setState({selectStatus: new Map<string, boolean>([[propertyName, isExpanded]])});
    }

    isSelectOpen = (propertyName: string): boolean => {
        return this.state.selectStatus.has(propertyName) && this.state.selectStatus.get(propertyName) === true;
    }

    getSelectBean = (property: ComponentProperty, value: any) => {
        const selectOptions: JSX.Element[] = [];
        const beans = CamelUi.getBeans(this.props.integration);
        if (beans) {
            selectOptions.push(<SelectOption key={0} value={"Select..."} isPlaceholder/>);
            selectOptions.push(...beans.map((bean) => <SelectOption key={bean.name} value={beanPrefix + bean.name} description={bean.type}/>));
        }
        return (
            <Select
                id={this.state.id} name={this.state.id}
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => this.parametersChanged(property.name, (!isPlaceholder ? value : undefined))}
                selections={value}
                isOpen={this.isSelectOpen(property.name)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    canBeInternalUri = (property: ComponentProperty): boolean => {
        if (this.props.element && this.props.element.dslName === 'ToDefinition' && property.name === 'name') {
            const uri: string = (this.props.element as ToDefinition).uri || '';
            return uri.startsWith("direct") || uri.startsWith("seda");
        } else {
            return false;
        }
    }

    getInternalComponentName = (property: ComponentProperty): string => {
        if (this.props.element && this.props.element.dslName === 'ToDefinition' && property.name === 'name') {
            const uri: string = (this.props.element as ToDefinition).uri || '';
            if (uri.startsWith("direct")) return "direct";
            if (uri.startsWith("seda")) return "seda";
            return '';
        } else {
            return '';
        }
    }

    getInternalUriSelect = (property: ComponentProperty, value: any) => {
        const selectOptions: JSX.Element[] = [];
        const componentName = this.getInternalComponentName(property);
        const internalUris = CamelUi.getInternalRouteUris(this.props.integration, componentName, false);
        const uris: string [] = [];
        uris.push(...internalUris);
        if (value && value.length > 0 && !uris.includes(value)) {
            uris.unshift(value);
        }
        if (uris && uris.length > 0) {
            selectOptions.push(...uris.map((value: string) =>
                <SelectOption key={value} value={value ? value.trim() : value}/>));
        }
        return <InputGroup id={this.state.id} name={this.state.id}>
            <InputGroupItem><Select
                id={this.state.id} name={this.state.id}
                placeholderText="Select or type an URI"
                variant={SelectVariant.typeahead}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => {
                    this.parametersChanged(property.name, (!isPlaceholder ? value : undefined), property.kind === 'path', undefined);
                }}
                selections={value}
                isOpen={this.isSelectOpen(property.name)}
                isCreatable={true}
                createText=""
                isInputFilterPersisted={true}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select></InputGroupItem>
            <InputGroupItem><Tooltip position="bottom-end" content={"Create route"}>
                <Button isDisabled={value === undefined} variant="control" onClick={e => {
                    if (value) {
                        const newRoute = !internalUris.includes(value.toString()) ? new RouteToCreate(componentName, value.toString()) : undefined;
                        this.parametersChanged(property.name, value, property.kind === 'path', newRoute);
                    }
                }}>
                    {<PlusIcon/>}
                </Button>
            </Tooltip></InputGroupItem>
        </InputGroup>
    }

    selectInfrastructure = (value: string) => {
        // check if there is a selection
        const textVal = this.state.ref.current;
        const cursorStart = textVal.selectionStart;
        const cursorEnd = textVal.selectionEnd;
        if (cursorStart !== cursorEnd){
            const prevValue = this.props.value;
            const selectedText = prevValue.substring(cursorStart, cursorEnd)
            value = prevValue.replace(selectedText, value);
        }
        const propertyName = this.state.infrastructureSelectorProperty;
        if (propertyName) {
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            this.parametersChanged(propertyName, value);
            this.setState({showInfrastructureSelector: false, infrastructureSelectorProperty: undefined})
        }
    }

    openInfrastructureSelector = (propertyName: string) => {
        this.setState({infrastructureSelectorProperty: propertyName, showInfrastructureSelector: true});
    }

    closeInfrastructureSelector = () => {
        this.setState({showInfrastructureSelector: false})
    }

    getInfrastructureSelectorModal() {
        return (
            <InfrastructureSelector
                dark={false}
                isOpen={this.state.showInfrastructureSelector}
                onClose={() => this.closeInfrastructureSelector()}
                onSelect={this.selectInfrastructure}/>)
    }

    getStringInput(property: ComponentProperty, value: any) {
        const {showEditor, showPassword} = this.state;
        const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.name);
        const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? <KubernetesIcon/> : <DockerIcon/>
        return <InputGroup>
            {inInfrastructure && !showEditor && !noInfraSelectorButton &&
                <Tooltip position="bottom-end" content={"Select from " + capitalize((InfrastructureAPI.infrastructure))}>
                    <Button variant="control" onClick={e => this.openInfrastructureSelector(property.name)}>
                        {icon}
                    </Button>
                </Tooltip>}
            {(!showEditor || property.secret) &&
                <TextInput className="text-field" isRequired ref={this.state.ref}
                           type={property.secret && !showPassword ? "password" : "text"}
                           id={this.state.id} name={this.state.id}
                           value={value !== undefined ? value : property.defaultValue}
                           onChange={(e, value) => this.parametersChanged(property.name, value, property.kind === 'path')}/>}
            {showEditor && !property.secret &&
                <TextArea autoResize={true} ref={this.state.ref}
                          className="text-field" isRequired
                          type="text"
                          id={this.state.id} name={this.state.id}
                          value={value !== undefined ? value : property.defaultValue}
                          onChange={(e, value) => this.parametersChanged(property.name, value, property.kind === 'path')}/>}
            {!property.secret &&
                <Tooltip position="bottom-end" content={showEditor ? "Change to TextField" : "Change to Text Area"}>
                    <Button variant="control" onClick={e => this.setState({showEditor: !showEditor})}>
                        {showEditor ? <CompressIcon/> : <ExpandIcon/>}
                    </Button>
                </Tooltip>
            }
            {property.secret &&
                <Tooltip position="bottom-end" content={showPassword ? "Hide" : "Show"}>
                    <Button variant="control" onClick={e => this.setState({showPassword: !showPassword})}>
                        {showPassword ? <ShowIcon/> : <HideIcon/>}
                    </Button>
                </Tooltip>
            }
        </InputGroup>
    }

    getTextInput = (property: ComponentProperty, value: any) => {
        return (
            <TextInput
                className="text-field" isRequired
                type={['integer', 'int', 'number'].includes(property.type) ? 'number' : (property.secret ? "password" : "text")}
                id={this.state.id} name={this.state.id}
                value={value !== undefined ? value : property.defaultValue}
                onChange={(e, value) => {
                    this.parametersChanged(property.name, ['integer', 'int', 'number'].includes(property.type) ? Number(value) : value, property.kind === 'path')
                }}/>
        )
    }

    getSelect = (property: ComponentProperty, value: any) => {
        const selectOptions: JSX.Element[] = []
        if (property.enum && property.enum.length > 0) {
            selectOptions.push(<SelectOption key={0} value={"Select ..."} isPlaceholder/>);
            property.enum.forEach(v => selectOptions.push(<SelectOption key={v} value={v}/>));
        }
        return (
            <Select
                id={this.state.id} name={this.state.id}
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={(_event, isExpanded) => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => this.parametersChanged(property.name, (!isPlaceholder ? value : undefined), property.kind === 'path')}
                selections={value !== undefined ? value.toString() : property.defaultValue}
                isOpen={this.isSelectOpen(property.name)}
                aria-labelledby={property.name}
                direction={SelectDirection.down}
            >
                {selectOptions}
            </Select>
        )
    }

    getSwitch = (property: ComponentProperty, value: any) => {
        return (
            <Switch
                id={this.state.id} name={this.state.id}
                value={value?.toString()}
                aria-label={this.state.id}
                isChecked={value !== undefined ? Boolean(value) : property.defaultValue !== undefined && property.defaultValue === 'true'}
                onChange={e => this.parametersChanged(property.name, !Boolean(value))}/>
        )
    }

    render() {
        const property: ComponentProperty = this.props.property;
        const value = this.props.value;
        const id = this.state.id;
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
                            <HelpIcon />
                        </button>
                    </Popover>
                }>
                {this.canBeInternalUri(property) && this.getInternalUriSelect(property, value)}
                {property.type === 'string' && property.enum === undefined && !this.canBeInternalUri(property)
                    && this.getStringInput(property, value)}
                {['duration', 'integer', 'int', 'number'].includes(property.type) && property.enum === undefined && !this.canBeInternalUri(property)
                    && this.getTextInput(property, value)}
                {['object'].includes(property.type) && !property.enum
                    && this.getSelectBean(property, value)}
                {['string', 'object'].includes(property.type) && property.enum
                    && this.getSelect(property, value)}
                {property.type === 'boolean'
                    && this.getSwitch(property, value)}
                {this.getInfrastructureSelectorModal()}
            </FormGroup>
        )
    }
}
