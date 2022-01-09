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
    SelectOption, ExpandableSection,
} from '@patternfly/react-core';
import '../karavan.css';
import "@patternfly/patternfly/patternfly.css";
import HelpIcon from "@patternfly/react-icons/dist/js/icons/help-icon";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import { PropertyMeta} from "karavan-core/lib/api/CamelMetadata";
import {CamelApiExt} from "karavan-core/lib/api/CamelApiExt";
import {ExpressionField} from "./ExpressionField";
import {CamelUi} from "karavan-core/lib/api/CamelUi";
import {ComponentParameterField} from "./ComponentParameterField";
import {CamelElement} from "karavan-core/lib/model/CamelModel";
import {KameletPropertyField} from "./KameletPropertyField";
import {DataFormat} from "karavan-core/lib/model/CamelDataFormat";

interface Props {
    property: PropertyMeta,
    value: any,
    onChange?: (fieldId: string, value: string | number | boolean | any) => void,
    onExpressionChange?: (language: string, value: string | undefined) => void,
    onDataFormatChange?: (dataFormat: string, value: DataFormat) => void,
    onParameterChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean) => void,
    element?: CamelElement
}

interface State {
    selectStatus: Map<string, boolean>,
    isShowAdvanced: boolean
}

export class DslPropertyField extends React.Component<Props, State> {

    public state: State = {
        selectStatus: new Map<string, boolean>(),
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

    render() {
        const isKamelet = CamelUi.isKameletComponent(this.props.element);
        const property: PropertyMeta = this.props.property;
        const value = this.props.value;
        const selectOptions: JSX.Element[] = []
        if (property.enumVals && property.enumVals.length > 0) {
            selectOptions.push(<SelectOption key={0} value={"Select " + property.name} isPlaceholder/>);
            selectOptions.push(...property.enumVals.split(',').map((value: string) =>
                <SelectOption key={value} value={value.trim()}/>));
        }
        return (
            <FormGroup
                key={property.name}
                label={CamelUtil.capitalizeName(property.displayName)}
                fieldId={property.name}
                labelIcon={property.description ?
                    <Popover
                        position={"left"}
                        headerContent={property.displayName}
                        bodyContent={property.description}
                        footerContent={property.defaultValue !== undefined ? "Default: " + property.defaultValue : undefined}>
                        <button type="button" aria-label="More info" onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                                className="pf-c-form__group-label-help">
                            <HelpIcon noVerticalAlign/>
                        </button>
                    </Popover> : <div></div>
                }>
                {['string', 'duration', 'integer', 'number'].includes(property.type) && !property.enumVals &&
                <TextInput
                    // isReadOnly={property.name === 'uri' && this.state.element?.dslName !== 'toD'}
                    className="text-field" isRequired
                    type={['integer', 'number'].includes(property.type) ? 'number' : (property.secret ? "password" : "text")}
                    id={property.name} name={property.name}
                    value={value?.toString()}
                    onChange={e => this.propertyChanged(property.name, ['integer', 'number'].includes(property.type) ? Number(e) : e)}/>
                }
                {property.type === 'boolean' && <Switch
                    id={property.name} name={property.name}
                    value={value?.toString()}
                    aria-label={property.name}
                    isChecked={Boolean(value) === true}
                    onChange={e => this.propertyChanged(property.name, !Boolean(value))}/>
                }

                {property.enumVals &&
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
                }
                {property.name === 'expression' && property.type === "Expression" &&
                <div className="expression">
                    <ExpressionField property={property} value={value} onExpressionChange={this.props.onExpressionChange} />
                </div>
                }
                {property.name === 'parameters' &&
                <div className="parameters">
                    {!isKamelet && CamelUi.getComponentProperties(this.props.element, false).map(kp =>
                        <ComponentParameterField
                            property={kp}
                            value={CamelApiExt.getParametersValue(this.props.element, kp.name, kp.kind === 'path')}
                            onParameterChange={this.props.onParameterChange}
                        />)}
                    {isKamelet && CamelUi.getKameletProperties(this.props.element).map(property =>
                         <KameletPropertyField
                            property={property}
                            value={CamelApiExt.getParametersValue(this.props.element, property.id)}
                            onParameterChange={this.props.onParameterChange}
                        />)}
                </div>
                }
                {property.name === 'parameters' && this.props.element && !isKamelet && CamelUi.getComponentProperties(this.props.element, true).length > 0 && (
                    <ExpandableSection
                        toggleText={'Advanced parameters'}
                        onToggle={isExpanded => this.setState({isShowAdvanced: !this.state.isShowAdvanced})}
                        isExpanded={this.state.isShowAdvanced}>
                        <div className="parameters">
                            {CamelUi.getComponentProperties(this.props.element, true).map(kp =>
                                <ComponentParameterField
                                    property={kp}
                                    value={CamelApiExt.getParametersValue(this.props.element, kp.name, kp.kind === 'path')}
                                    onParameterChange={this.props.onParameterChange}
                                />
                            )}
                        </div>
                    </ExpandableSection>
                )}
            </FormGroup>
        )
    }
}