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
    Select,
    SelectVariant,
    SelectDirection,
    SelectOption, InputGroup, TextArea, Tooltip, Button,
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {CamelUi, RouteToCreate} from "../../utils/CamelUi";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {ToDefinition} from "karavan-core/lib/model/CamelDefinition";
import CompressIcon from "@patternfly/react-icons/dist/js/icons/compress-icon";
import ExpandIcon from "@patternfly/react-icons/dist/js/icons/expand-icon";
import {KubernetesSelector} from "./KubernetesSelector";
import {KubernetesAPI} from "../../utils/KubernetesAPI";
import KubernetesIcon from "@patternfly/react-icons/dist/js/icons/openshift-icon";

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
    showKubernetesSelector: boolean
    kubernetesSelectorProperty?: string
    ref: any
}

export class ComponentParameterField extends React.Component<Props, State> {

    public state: State = {
        selectStatus: new Map<string, boolean>(),
        showEditor: false,
        showKubernetesSelector: false,
        ref: React.createRef(),
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
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={isExpanded => {
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
        const urls = CamelUi.getInternalRouteUris(this.props.integration, componentName, false);
        if (urls && urls.length > 0) {
            selectOptions.push(...urls.map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>));
        }
        return (
            <Select
                placeholderText="Select or type an URI"
                variant={SelectVariant.typeahead}
                aria-label={property.name}
                onToggle={isExpanded => {
                    this.openSelect(property.name, isExpanded)
                }}
                onSelect={(e, value, isPlaceholder) => {
                    const newRoute = !urls.includes(value.toString()) ? new RouteToCreate(componentName, value.toString()) : undefined;
                    this.parametersChanged(property.name, (!isPlaceholder ? value : undefined), property.kind === 'path', newRoute);
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

    selectKubernetes = (value: string) => {
        // check if there is a selection
        const textVal = this.state.ref.current;
        const cursorStart = textVal.selectionStart;
        const cursorEnd = textVal.selectionEnd;
        if (cursorStart !== cursorEnd){
            const prevValue = this.props.value;
            const selectedText = prevValue.substring(cursorStart, cursorEnd)
            value = prevValue.replace(selectedText, value);
        }
        const propertyName = this.state.kubernetesSelectorProperty;
        if (propertyName) {
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            this.parametersChanged(propertyName, value);
            this.setState({showKubernetesSelector: false, kubernetesSelectorProperty: undefined})
        }
    }

    openKubernetesSelector = (propertyName: string) => {
        this.setState({kubernetesSelectorProperty: propertyName, showKubernetesSelector: true});
    }

    closeKubernetesSelector = () => {
        this.setState({showKubernetesSelector: false})
    }

    getKubernetesSelectorModal() {
        return (
            <KubernetesSelector
                dark={false}
                isOpen={this.state.showKubernetesSelector}
                onClose={() => this.closeKubernetesSelector()}
                onSelect={this.selectKubernetes}/>)
    }

    getStringInput(property: ComponentProperty, value: any) {
        const showEditor = this.state.showEditor;
        const inKubernetes = KubernetesAPI.inKubernetes;
        const id = prefix + "-" + property.name;
        const noKubeSelectorButton = ["uri", "id", "description", "group"].includes(property.name);
        return <InputGroup>
            {inKubernetes && !showEditor && !noKubeSelectorButton &&
                <Tooltip position="bottom-end" content="Select from Kubernetes">
                    <Button variant="control" onClick={e => this.openKubernetesSelector(property.name)}>
                        <KubernetesIcon/>
                    </Button>
                </Tooltip>}
            {(!showEditor || property.secret) &&
                <TextInput className="text-field" isRequired ref={this.state.ref}
                           type={property.secret ? "password" : "text"}
                           id={id} name={id}
                           value={value !== undefined ? value : property.defaultValue}
                           onChange={e => this.parametersChanged(property.name, e, property.kind === 'path')}/>}
            {showEditor && !property.secret &&
                <TextArea autoResize={true} ref={this.state.ref}
                          className="text-field" isRequired
                          type="text"
                          id={id} name={id}
                          value={value !== undefined ? value : property.defaultValue}
                          onChange={e => this.parametersChanged(property.name, e, property.kind === 'path')}/>}
            {!property.secret &&
                <Tooltip position="bottom-end" content={showEditor ? "Change to TextField" : "Change to Text Area"}>
                    <Button variant="control" onClick={e => this.setState({showEditor: !showEditor})}>
                        {showEditor ? <CompressIcon/> : <ExpandIcon/>}
                    </Button>
                </Tooltip>
            }
        </InputGroup>
    }

    getTextInput = (property: ComponentProperty, value: any) => {
        const id = prefix + "-" + property.name;
        return (
            <TextInput
                className="text-field" isRequired
                type={['integer', 'int', 'number'].includes(property.type) ? 'number' : (property.secret ? "password" : "text")}
                id={id} name={id}
                value={value !== undefined ? value : property.defaultValue}
                onChange={e => this.parametersChanged(property.name, ['integer', 'int', 'number'].includes(property.type) ? Number(e) : e, property.kind === 'path')}/>
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
                variant={SelectVariant.single}
                aria-label={property.name}
                onToggle={isExpanded => {
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
        const id = prefix + "-" + property.name;
        return (
            <Switch
                id={id} name={id}
                value={value?.toString()}
                aria-label={id}
                isChecked={value !== undefined ? Boolean(value) === true : property.defaultValue !== undefined && property.defaultValue === 'true'}
                onChange={e => this.parametersChanged(property.name, !Boolean(value))}/>
        )
    }

    render() {
        const property: ComponentProperty = this.props.property;
        const value = this.props.value;
        const id = prefix + "-" + property.name;
        return (
            <FormGroup
                key={id}
                label={property.displayName}
                fieldId={id}
                isRequired={property.required}
                labelIcon={
                    <Popover
                        position={"left"}
                        headerContent={property.displayName}
                        bodyContent={property.description}
                        footerContent={
                            <div>
                                {property.defaultValue !== undefined && <div>{"Default: " + property.defaultValue}</div>}
                                {property.required === true && <div>{property.displayName + " is required"}</div>}
                            </div>
                        }>
                        <button type="button" aria-label="More info" onClick={e => e.preventDefault()}
                                className="pf-c-form__group-label-help">
                            <HelpIcon noVerticalAlign/>
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
                {this.getKubernetesSelectorModal()}
            </FormGroup>
        )
    }
}
