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
import React, {useState} from 'react';
import {
    Dropdown,
    MenuToggleElement,
    MenuToggle,
    DropdownList,
    DropdownItem,
    Popover,
    Flex,
    TextInput,
    FormGroup,
    Form,
    Button,
    FlexItem,
    DropdownGroup, Divider
} from '@patternfly/react-core';
import '../../karavan.css';
import './ComponentPropertyPlaceholderDropdown.css';
import "@patternfly/patternfly/patternfly.css";
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {RouteToCreate} from "../../utils/CamelUi";
import {usePropertiesHook} from "../usePropertiesHook";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import AddIcon from "@patternfly/react-icons/dist/js/icons/plus-icon";
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";

const SYNTAX_EXAMPLES = [
    {key: 'property:', value: 'group.property', description: 'Application property'},
    {key: 'env:', value: 'env:ENV_NAME', description: 'OS environment variable'},
    {key: 'sys:', value: 'sys:JvmPropertyName', description: 'JVM system property'},
    {key: 'bean:', value: 'bean:beanName.method', description: 'Bean’s method'}
]

interface Props {
    property: ComponentProperty,
    value: any
}

export function ComponentPropertyPlaceholderDropdown(props: Props) {

    const {onParametersChange} = usePropertiesHook();
    const [propertyPlaceholders, setPropertyPlaceholders] = useDesignerStore((s) =>
        [s.propertyPlaceholders, s.setPropertyPlaceholders], shallow)
    const [isOpenPlaceholdersDropdown, setOpenPlaceholdersDropdown] = useState<boolean>(false);
    const [propValue, setPropValue] = useState<string>('');
    const [isVisible, setIsVisible] = React.useState(false);

    function removeBrackets(val: string) {
        return val.replace('{{', '').replace('}}', '');
    }

    const {property, value} = props;
    const valueIsPlaceholder: boolean = value && value.toString().startsWith('{{') && value.toString().endsWith('}}');
    const placeholderValue = valueIsPlaceholder ? value.toString().replace('{{', '').replace('}}', '') : undefined;
    const showAddButton = valueIsPlaceholder
        && !propertyPlaceholders.includes(placeholderValue)
        && !SYNTAX_EXAMPLES.map(se=> se.value).includes(removeBrackets(placeholderValue))
        && SYNTAX_EXAMPLES.findIndex(se=> removeBrackets(placeholderValue).startsWith(se.key)) === -1;
    const popoverId = "popover-selector-" + property.name;

    const hasPlaceholders = (propertyPlaceholders && propertyPlaceholders.length > 0 );

    function parametersChanged(parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) {
        onParametersChange(parameter, value, pathParameter, newRoute);
    }

    function onMenuToggleClick() {
        if (!showAddButton) {
            setOpenPlaceholdersDropdown(!isOpenPlaceholdersDropdown)
        }
    }

    function saveProperty() {
        InfrastructureAPI.onSavePropertyPlaceholder(placeholderValue, propValue);
        setIsVisible(false);
        const p = [...propertyPlaceholders]
        p.push(placeholderValue);
        setPropertyPlaceholders(p);
    }

    function getPopover() {
        return (
            <Popover
                isVisible={isVisible}
                shouldOpen={(_event, _fn) => setIsVisible(true)}
                shouldClose={(_event, _fn) => setIsVisible(false)}
                aria-label="Add property"
                headerContent={"Add property"}
                bodyContent={
                    <Form isHorizontal className="property-placeholder-toggle-form" autoComplete="off">
                        <FormGroup isInline label="Property" isRequired fieldId="property">
                            <TextInput id="property" readOnly value={placeholderValue}/>
                        </FormGroup>
                        <FormGroup isInline label="Value" isRequired fieldId="value">
                            <TextInput id="value" isRequired value={propValue}
                                       onChange={(_, value) => setPropValue(value)}/>
                        </FormGroup>
                    </Form>
                }
                footerContent={
                    <Flex>
                        <FlexItem align={{default: "alignRight"}}>
                            <Button
                                onClick={() => saveProperty()}>
                                Save
                            </Button>
                        </FlexItem>
                    </Flex>
                }
                triggerRef={() => document.getElementById(popoverId) as HTMLButtonElement}
            />
        )
    }

    function getToggle(toggleRef: React.Ref<MenuToggleElement>) {
        return (
            <MenuToggle className="property-placeholder-toggle"
                        id={popoverId}
                        ref={toggleRef}
                        aria-label="placeholder menu"
                        variant="default"
                        onClick={() => onMenuToggleClick()}
                        isExpanded={isOpenPlaceholdersDropdown}
            >
                {showAddButton ? <AddIcon/> : <EllipsisVIcon/>}
                {showAddButton && getPopover()}
            </MenuToggle>
        )
    }

    return (
        <Dropdown
            popperProps={{position: "end"}}
            isOpen={isOpenPlaceholdersDropdown}
            onSelect={(_, value) => {
                parametersChanged(property.name, `{{${value}}}`, property.kind === 'path')
                setOpenPlaceholdersDropdown(false);
            }}
            onOpenChange={(isOpen: boolean) => setOpenPlaceholdersDropdown(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => getToggle(toggleRef)}
            shouldFocusToggleOnSelect
        >
            <DropdownList>
                {hasPlaceholders && <DropdownGroup label="Application Properties">
                    {propertyPlaceholders.map((pp, index) =>
                        <DropdownItem value={pp} key={index}>{pp}</DropdownItem>
                    )}
                </DropdownGroup>}
                {hasPlaceholders && <Divider component="li"/>}
                <DropdownGroup label="Syntax examples">
                    {SYNTAX_EXAMPLES.map(se =>
                        <DropdownItem value={se.value} key={se.key} description={se.description}>
                            {se.value}
                        </DropdownItem>)
                    }
                </DropdownGroup>
            </DropdownList>
        </Dropdown>
    )
}
