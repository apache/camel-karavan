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
    Switch, InputGroup, Button, TextArea, Tooltip, capitalize
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import ExpandIcon from "@patternfly/react-icons/dist/js/icons/expand-icon";
import CompressIcon from "@patternfly/react-icons/dist/js/icons/compress-icon";
import {Property} from "karavan-core/lib/model/KameletModels";
import {InfrastructureSelector} from "./InfrastructureSelector";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import KubernetesIcon from "@patternfly/react-icons/dist/js/icons/openshift-icon";
import ShowIcon from "@patternfly/react-icons/dist/js/icons/eye-icon";
import HideIcon from "@patternfly/react-icons/dist/js/icons/eye-slash-icon";
import DockerIcon from "@patternfly/react-icons/dist/js/icons/docker-icon";

interface Props {
    property: Property,
    value: any,
    required: boolean,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => void
}

interface State {
    selectIsOpen: boolean
    showEditor: boolean
    showPassword: boolean
    showInfrastructureSelector: boolean
    infrastructureSelectorProperty?: string
    ref: any
}

export class KameletPropertyField extends React.Component<Props, State> {

    public state: State = {
        selectIsOpen: false,
        showEditor: false,
        showPassword: false,
        showInfrastructureSelector: false,
        ref: React.createRef(),
    }

    openSelect = () => {
        this.setState({selectIsOpen: true});
    }

    parametersChanged = (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => {
        this.props.onParameterChange?.call(this, parameter, value, pathParameter);
        this.setState({selectIsOpen: false});
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
        const propertyId = this.state.infrastructureSelectorProperty;
        if (propertyId){
            if (value.startsWith("config") || value.startsWith("secret")) value = "{{" + value + "}}";
            this.parametersChanged(propertyId, value);
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

    getStringInput() {
        const {showEditor, showPassword} = this.state;
        const {property, value} = this.props;
        const prefix = "parameters";
        const id = prefix + "-" + property.id;
        const inInfrastructure = InfrastructureAPI.infrastructure !== 'local';
        const noInfraSelectorButton = ["uri", "id", "description", "group"].includes(property.id);
        const icon = InfrastructureAPI.infrastructure === 'kubernetes' ? <KubernetesIcon/> : <DockerIcon/>
        const showInfraSelectorButton = inInfrastructure && !showEditor && !noInfraSelectorButton
        return <InputGroup>
            {showInfraSelectorButton  &&
                <Tooltip position="bottom-end" content={"Select from " + capitalize(InfrastructureAPI.infrastructure)}>
                    <Button variant="control" onClick={e => this.openInfrastructureSelector(property.id)}>
                        {icon}
                    </Button>
                </Tooltip>}
            {(!showEditor || property.format === "password") &&
                <TextInput
                    ref={this.state.ref}
                    className="text-field" isRequired
                    type={property.format && !showPassword ? "password" : "text"}
                    id={id} name={id}
                    value={value}
                    onChange={(e, value) => this.parametersChanged(property.id, value)}/>}
            {showEditor && property.format !== "password" &&
                <TextArea autoResize={true}
                          className="text-field" isRequired
                          type="text"
                          id={id} name={id}
                          value={value}
                          onChange={(e, value) => this.parametersChanged(property.id, value)}/>}
            {property.format !== "password" &&
                <Tooltip position="bottom-end" content={showEditor ? "Change to TextField" : "Change to Text Area"}>
                    <Button variant="control" onClick={e => this.setState({showEditor: !showEditor})}>
                        {showEditor ? <CompressIcon/> : <ExpandIcon/>}
                    </Button>
                </Tooltip>
            }
            {property.format === "password" &&
                <Tooltip position="bottom-end" content={showPassword ? "Hide" : "Show"}>
                    <Button variant="control" onClick={e => this.setState({showPassword: !showPassword})}>
                        {showPassword ? <ShowIcon/> : <HideIcon/>}
                    </Button>
                </Tooltip>
            }
        </InputGroup>
    }

    render() {
        const property = this.props.property;
        const value = this.props.value;
        const prefix = "parameters";
        const id = prefix + "-" + property.id;
        return (
            <div>
                <FormGroup
                    key={id}
                    label={property.title}
                    fieldId={id}
                    isRequired={this.props.required}
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
                    {property.type === 'string' && this.getStringInput()
                    }
                    {['integer', 'int', 'number'].includes(property.type) &&
                        <TextInput className="text-field" isRequired type='number' id={id} name={id} value={value}
                                   onChange={(e, value) => this.parametersChanged(property.id, Number(value))}
                        />
                    }
                    {property.type === 'boolean' && <Switch
                        id={id} name={id}
                        value={value?.toString()}
                        aria-label={id}
                        isChecked={Boolean(value) === true}
                        onChange={e => this.parametersChanged(property.id, !Boolean(value))}/>
                    }
                </FormGroup>
                {this.getInfrastructureSelectorModal()}
            </div>
        )
    }
}