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
    SelectOption,
} from '@patternfly/react-core';
import '../../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {ComponentProperty} from "../../model/ComponentModels";

interface Props {
    property: ComponentProperty,
    value: any,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => void
}

interface State {
    selectIsOpen: boolean
}

export class ComponentParameterField extends React.Component<Props, State> {

    public state: State = {
        selectIsOpen: false,
    }

    openSelect = () => {
        this.setState({selectIsOpen: true});
    }

    parametersChanged = (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => {
        this.props.onParameterChange?.call(this, parameter, value, pathParameter);
        this.setState({selectIsOpen: false});
    }

    render() {
        const property: ComponentProperty = this.props.property;
        const value = this.props.value;
        const prefix = "parameters";
        const id = prefix + "-" + property.name;
        const selectOptions: JSX.Element[] = []
        if (property.enum && property.enum.length > 0) {
            selectOptions.push(<SelectOption key={0} value={"Select ..."} isPlaceholder/>);
            property.enum.forEach(v => selectOptions.push(<SelectOption key={v} value={v}/>));
        }
        return (
            <FormGroup
                key={id}
                label={property.displayName}
                fieldId={id}
                isRequired={property.kind === 'path' || property.required}
                labelIcon={
                    <Popover
                        position={"left"}
                        headerContent={property.displayName}
                        bodyContent={property.description}
                        footerContent={property.defaultValue !== undefined ? "Default: " + property.defaultValue : undefined}>
                        <button type="button" aria-label="More info" onClick={e => e.preventDefault()}
                                className="pf-c-form__group-label-help">
                            <HelpIcon noVerticalAlign/>
                        </button>
                    </Popover>
                }>
                {['string', 'duration', 'integer', 'int', 'number'].includes(property.type) && property.enum === undefined &&
                <TextInput
                    className="text-field" isRequired
                    type={['integer', 'int', 'number'].includes(property.type) ? 'number' : (property.secret ? "password" : "text")}
                    id={id} name={id}
                    value={value !== undefined ? value : property.defaultValue}
                    onChange={e => this.parametersChanged(property.name, ['integer', 'int', 'number'].includes(property.type) ? Number(e) : e, property.kind === 'path')}/>
                }
                {property.type === 'string' && property.enum &&
                <Select
                    variant={SelectVariant.single}
                    aria-label={property.name}
                    onToggle={isExpanded => {
                        this.openSelect()
                    }}
                    onSelect={(e, value, isPlaceholder) => this.parametersChanged(property.name, (!isPlaceholder ? value : undefined), property.kind === 'path')}
                    selections={value !== undefined ? value.toString() : property.defaultValue}
                    isOpen={this.state.selectIsOpen}
                    aria-labelledby={property.name}
                    direction={SelectDirection.down}
                >
                    {selectOptions}
                </Select>
                }
                {property.type === 'boolean' && <Switch
                    id={id} name={id}
                    value={value?.toString()}
                    aria-label={id}
                    isChecked={value !== undefined ? Boolean(value) === true : Boolean(property.defaultValue) === true}
                    onChange={e => this.parametersChanged(property.name, !Boolean(value))}/>
                }
            </FormGroup>
        )
    }
}