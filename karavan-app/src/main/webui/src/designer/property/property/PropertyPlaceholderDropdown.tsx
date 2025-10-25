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
    Button,
    Divider,
    Dropdown,
    DropdownGroup,
    DropdownItem,
    DropdownList,
    Flex,
    FlexItem,
    Form,
    FormGroup,
    MenuToggle,
    MenuToggleElement,
    Popover,
    TextInput
} from '@patternfly/react-core';
import './PropertyPlaceholderDropdown.css';
import {ComponentProperty} from "karavan-core/lib/model/ComponentModels";
import {useDesignerStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import {EllipsisVIcon, PlusIcon} from '@patternfly/react-icons';
import {InfrastructureAPI} from "../../utils/InfrastructureAPI";
import {PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {RouteToCreate} from "../../utils/CamelUi";
import {Property} from "karavan-core/lib/model/KameletModels";

const SYNTAX_EXAMPLES = [
    {key: 'property:', value: 'group.property', description: 'Application property'},
    {key: 'env:', value: 'env:ENV_NAME', description: 'OS environment variable'},
    {key: 'sys:', value: 'sys:JvmPropertyName', description: 'JVM system property'},
    {key: 'bean:', value: 'bean:beanName.method', description: 'Bean’s method'}
]

interface Props {
    property: ComponentProperty | PropertyMeta | Property,
    value: any,
    onDslPropertyChange?: (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) => void,
    onComponentPropertyChange?: (parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) => void
}

export function PropertyPlaceholderDropdown(props: Props) {

    const [propertyPlaceholders, setPropertyPlaceholders, parameterPlaceholders] = useDesignerStore((s) =>
        [s.propertyPlaceholders, s.setPropertyPlaceholders, s.parameterPlaceholders], shallow)
    const [isOpenPlaceholdersDropdown, setOpenPlaceholdersDropdown] = useState<boolean>(false);
    const [propValue, setPropValue] = useState<string>('');
    const [isVisible, setIsVisible] = React.useState(false);

    function removeBrackets(val: string) {
        return val.replace('{{', '').replace('}}', '');
    }

    const {property, value} = props;
    const valueIsPlaceholder: boolean = value && value.toString().startsWith('{{') && value.toString().endsWith('}}');
    const placeholderValue = valueIsPlaceholder ? value.toString().replace('{{', '').replace('}}', '') : undefined;
    const isRouteTemplateParameter = parameterPlaceholders.map(p => p[0]).includes(placeholderValue);
    const showAddButton = valueIsPlaceholder
        && !isRouteTemplateParameter
        && !propertyPlaceholders.includes(placeholderValue)
        && !SYNTAX_EXAMPLES.map(se => se.value).includes(removeBrackets(placeholderValue))
        && SYNTAX_EXAMPLES.findIndex(se => removeBrackets(placeholderValue).startsWith(se.key)) === -1;
    const popoverId = "popover-selector-" + property.hasOwnProperty('name') ? (property as any).name : (property as any).id;

    const hasPlaceholders = (propertyPlaceholders && propertyPlaceholders.length > 0);

    function parametersChanged(value: string | number | boolean | any) {
        if (property instanceof ComponentProperty) {
            props.onComponentPropertyChange?.(property.name, `{{${value}}}`, property.kind === 'path');
        } else if (property instanceof PropertyMeta) {
            props.onDslPropertyChange?.(property.name, `{{${value}}}`);
        } else {
            props.onDslPropertyChange?.((property as Property).id, `{{${value}}}`);
        }
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
                {showAddButton ? <PlusIcon/> : <EllipsisVIcon/>}
                {showAddButton && getPopover()}
            </MenuToggle>
        )
    }

    return (
        <Dropdown
            popperProps={{position: "end"}}
            isOpen={isOpenPlaceholdersDropdown}
            onSelect={(_, value) => {
                parametersChanged(value);
                setOpenPlaceholdersDropdown(false);
            }}
            onOpenChange={(isOpen: boolean) => setOpenPlaceholdersDropdown(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => getToggle(toggleRef)}
            shouldFocusToggleOnSelect
        >
            <DropdownList>
                {parameterPlaceholders &&
                    <DropdownGroup label="Template Parameters" className='property-placeholder-dropdown'>
                        {parameterPlaceholders.map((pp, index) =>
                            <DropdownItem value={pp[0]} key={index} description={pp[1]}>{pp[0]}</DropdownItem>
                        )}
                    </DropdownGroup>
                }
                {parameterPlaceholders && <Divider component="li"/>}
                {hasPlaceholders &&
                    <DropdownGroup label="Application Properties" className='property-placeholder-dropdown'>
                        {propertyPlaceholders.map((pp, index) =>
                            <DropdownItem value={pp[0]} key={index}>{pp[0]}</DropdownItem>
                        )}
                    </DropdownGroup>
                }
                {hasPlaceholders && <Divider component="li"/>}
                <DropdownGroup label="Syntax examples" className='property-placeholder-dropdown'>
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
