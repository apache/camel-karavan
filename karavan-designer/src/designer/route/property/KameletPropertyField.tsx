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
    Switch, InputGroup, Button, TextArea, Text, Tooltip,
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import ExpandIcon from "@patternfly/react-icons/dist/js/icons/expand-icon";
import CompressIcon from "@patternfly/react-icons/dist/js/icons/compress-icon";
import {Property} from "karavan-core/lib/model/KameletModels";

interface Props {
    property: Property,
    value: any,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => void
}

interface State {
    selectIsOpen: boolean
    showEditor: boolean
}

export class KameletPropertyField extends React.Component<Props, State> {

    public state: State = {
        selectIsOpen: false,
        showEditor: false,
    }

    openSelect = () => {
        this.setState({selectIsOpen: true});
    }

    parametersChanged = (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => {
        this.props.onParameterChange?.call(this, parameter, value, pathParameter);
        this.setState({selectIsOpen: false});
    }

    getStringInput() {
        const showEditor = this.state.showEditor;
        const property = this.props.property;
        const value = this.props.value;
        const prefix = "parameters";
        const id = prefix + "-" + property.id;
        return <InputGroup>
            {(!showEditor || property.format === "password") &&
                <TextInput
                    className="text-field" isRequired
                    type={property.format ? "password" : "text"}
                    id={id} name={id}
                    value={value}
                    onChange={e => this.parametersChanged(property.id, e)}/>}
            {showEditor && property.format !== "password" &&
                <TextArea autoResize={true}
                          className="text-field" isRequired
                          type="text"
                          id={id} name={id}
                          value={value}
                          onChange={e => this.parametersChanged(property.id, e)}/>}
            {property.format !== "password" &&
                <Tooltip position="bottom-end" content={showEditor ? "Change to TextField" : "Change to Text Area"}>
                    <Button variant="control" onClick={e => this.setState({showEditor: !showEditor})}>
                        {showEditor ? <CompressIcon/> : <ExpandIcon/>}
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
            <FormGroup
                data-tour={property.id}
                key={id}
                label={property.title}
                fieldId={id}
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
                                className="pf-c-form__group-label-help">
                            <HelpIcon noVerticalAlign/>
                        </button>
                    </Popover>
                }>
                {property.type === 'string' && this.getStringInput()
                }
                {['integer', 'int', 'number'].includes(property.type) &&
                    <TextInput className="text-field" isRequired type='number' id={id} name={id} value={value}
                               onChange={e => this.parametersChanged(property.id, Number(e))}
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
        )
    }
}