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
    SelectOption, ExpandableSection, TextArea, Chip, TextInputGroup, TextInputGroupMain, TextInputGroupUtilities, ChipGroup, Button, Text, Tooltip
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import DeleteIcon from "@patternfly/react-icons/dist/js/icons/times-circle-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {ExpressionField} from "./ExpressionField";
import {CamelUi} from "../CamelUi";
import {ComponentParameterField} from "./ComponentParameterField";
import {CamelElement, DataFormatDefinition} from "karavan-core/lib/model/CamelDefinition";
import {KameletPropertyField} from "./KameletPropertyField";
import {ExpressionDefinition} from "karavan-core/lib/model/CamelDefinition";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {ObjectField} from "./ObjectField";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-circle-icon";

interface Props {
    property: PropertyMeta,
    value: any,
    onChange?: (fieldId: string, value: string | number | boolean | any) => void,
    onExpressionChange?: (value: ExpressionDefinition) => void,
    onDataFormatChange?: (value: DataFormatDefinition) => void,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => void,
    element?: CamelElement
}

interface State {
    selectStatus: Map<string, boolean>,
    isShowAdvanced: boolean
    arrayValues: Map<string, string>
}

export class DslPropertyField extends React.Component<Props, State> {

    public state: State = {
        selectStatus: new Map<string, boolean>(),
        arrayValues: new Map<string, string>(),
        isShowAdvanced: false
    }

    openSelect = (propertyName: string) => {
        this.setState({selectStatus: new Map<string, boolean>([[propertyName, true]])});
    }

    isSelectOpen = (propertyName: string): boolean => {
        return this.state.selectStatus.has(propertyName) && this.state.selectStatus.get(propertyName) === true;
    }

    propertyChanged = (fieldId: string, value: string | number | boolean | any) => {
        this.props.onChange?.call(this, fieldId, value);
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
        if (property.isArray && property.type === 'string') {
            if (value) (value as any).push(newValue)
            else value = [newValue];
        }
        this.propertyChanged(fieldId, value);
        this.arrayChanged(fieldId, "");
    }

    getLabel = (property: PropertyMeta, value: any) => {
        if (property.isObject && !["ExpressionDefinition"].includes(property.type)) {
            const tooltip = value ? "Delete " + property.name : "Add " + property.name;
            const x = value ? undefined : CamelDefinitionApi.createStep(property.type, {});
            const icon = value ? (<DeleteIcon noVerticalAlign/>) : (<AddIcon noVerticalAlign/>);
            return (
                <div style={{display: "flex"}}>
                    <Text>{property.displayName} </Text>
                    <Tooltip position={"bottom"} content={<div>{tooltip}</div>}>
                        <button className="add-button" onClick={e => this.props.onChange?.call(this, property.name, x)} aria-label="Add element">
                            {icon}
                        </button>
                    </Tooltip>
                </div>
            )
        } else if (!["ExpressionDefinition"].includes(property.type)) {
            return CamelUtil.capitalizeName(property.displayName);
        }
    }

    getTextField = (property: PropertyMeta, value: any) => {
        return (
            <TextInput
                className="text-field" isRequired
                type={['integer', 'number'].includes(property.type) ? 'number' : (property.secret ? "password" : "text")}
                id={property.name} name={property.name}
                value={value?.toString()}
                onChange={e => this.propertyChanged(property.name, ['integer', 'number'].includes(property.type) ? Number(e) : e)}/>
        )
    }

    getTextArea = (property: PropertyMeta, value: any) => {
        return (
            <TextArea
                autoResize
                className="text-field" isRequired
                type={"text"}
                id={property.name} name={property.name}
                height={"100px"}
                value={value?.toString()}
                onChange={e => this.propertyChanged(property.name, e)}/>
        )
    }

    getExpressionField = (property: PropertyMeta, value: any) => {
        return (
            <div className="expression">
                <ExpressionField property={property} value={value} onExpressionChange={this.props.onExpressionChange}/>
            </div>
        )
    }

    getObjectField = (property: PropertyMeta, value: any) => {
        return (
            <div className="object">
                {value && <ObjectField property={property} value={value} onPropertyUpdate={this.props.onChange}/>}
            </div>
        )
    }

    getSwitch = (property: PropertyMeta, value: any) => {
        return (
            <Switch
                id={property.name} name={property.name}
                value={value?.toString()}
                aria-label={property.name}
                isChecked={Boolean(value) === true}
                onChange={e => this.propertyChanged(property.name, !Boolean(value))}/>
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
                onToggle={isExpanded => {
                    this.openSelect(property.name)
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

    getMultiValueField = (property: PropertyMeta, value: any) => {
        return (
            <div>
                <TextInputGroup className="input-group">
                    <TextInputGroupMain value={this.state.arrayValues.get(property.name)} onChange={e => this.arrayChanged(property.name, e)} onKeyUp={e => {
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

    getParameters = () => {
        const isKamelet = CamelUi.isKameletComponent(this.props.element);
        return (
            <div className="parameters">
                {!isKamelet && CamelUi.getComponentProperties(this.props.element, false).map(kp =>
                    <ComponentParameterField
                        key={kp.name}
                        property={kp}
                        value={CamelDefinitionApiExt.getParametersValue(this.props.element, kp.name, kp.kind === 'path')}
                        onParameterChange={this.props.onParameterChange}
                    />)}
                {isKamelet && CamelUi.getKameletProperties(this.props.element).map(property =>
                    <KameletPropertyField
                        key={property.id}
                        property={property}
                        value={CamelDefinitionApiExt.getParametersValue(this.props.element, property.id)}
                        onParameterChange={this.props.onParameterChange}
                    />)}
            </div>
        )
    }

    getAdvancedParameters = () => {
        return (
            <ExpandableSection
                toggleText={'Advanced parameters'}
                onToggle={isExpanded => this.setState({isShowAdvanced: !this.state.isShowAdvanced})}
                isExpanded={this.state.isShowAdvanced}>
                <div className="parameters">
                    {CamelUi.getComponentProperties(this.props.element, true).map(kp =>
                        <ComponentParameterField
                            key={kp.name}
                            property={kp}
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
                    footerContent={property.defaultValue !== undefined ? "Default: " + property.defaultValue : undefined}>
                    <button type="button" aria-label="More info" onClick={e => {
                        e.preventDefault();
                        e.stopPropagation();
                    }} className="pf-c-form__group-label-help">
                        <HelpIcon noVerticalAlign/>
                    </button>
                </Popover>
                : <div></div>
        )
    }

    render() {
        const isKamelet = CamelUi.isKameletComponent(this.props.element);
        const property: PropertyMeta = this.props.property;
        const value = this.props.value;
        return (
            <FormGroup
                label={this.getLabel(property, value)}
                fieldId={property.name}
                labelIcon={this.getLabelIcon(property)}>
                {value && ["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                    && this.getExpressionField(property, value)}
                {property.isObject && !property.isArray && !["ExpressionDefinition", "ExpressionSubElementDefinition"].includes(property.type)
                    && this.getObjectField(property, value)}
                {property.name === 'expression' && property.type === "string" && !property.isArray
                    && this.getTextArea(property, value)}
                {['string', 'duration', 'integer', 'number'].includes(property.type) && property.name !== 'expression' && !property.isArray && !property.enumVals
                    && this.getTextField(property, value)}
                {['string'].includes(property.type) && property.name !== 'expression' && property.isArray && !property.enumVals
                    && this.getMultiValueField(property, value)}
                {property.type === 'boolean'
                    && this.getSwitch(property, value)}
                {property.enumVals
                    && this.getSelect(property, value)}
                {property.name === 'parameters'
                    && this.getParameters()}
                {property.name === 'parameters' && this.props.element && !isKamelet && CamelUi.getComponentProperties(this.props.element, true).length > 0
                    && this.getAdvancedParameters()}
            </FormGroup>
        )
    }
}