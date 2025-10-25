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
import React, {useEffect, useRef, useState} from 'react';
import {
    Button,
    Dropdown,
    DropdownItem,
    DropdownList,
    MenuToggle,
    MenuToggleElement,
    SelectOptionProps,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities
} from '@patternfly/react-core';
import {PropertyMeta} from "karavan-core/lib/model/CamelMetadata";
import {RouteToCreate} from "../../utils/CamelUi";
import {PropertyUtil} from "./PropertyUtil";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

interface Props {
    property: PropertyMeta,
    value: any,
    selectOptions: SelectOptionProps[],
    onPropertyChange?: (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) => void,
    placeholder?: string
}


export function DslPropertyFieldSelectScrollable(props: Props) {

    const {property, onPropertyChange, value, selectOptions,placeholder} = props;
    const [isOpen, setIsOpen] = useState(false);
    const [isUserInput, setIsUserInput] = React.useState(false);
    const [inputValue, setInputValue] = React.useState<string>();
    const valueChangedClassName = PropertyUtil.hasDslPropertyValueChanged(property, value) ? 'value-changed' : '';
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => setInputValue(value), [])

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
            ref={toggleRef}
            onClick={() => setIsOpen(!isOpen)}
            isExpanded={isOpen}
            variant="typeahead"
            style={{width: '100%'}}
        >
            <TextInputGroup isPlain>
                <TextInputGroupMain
                    value={inputValue}
                    onClick={() => setIsOpen(true)}
                    onChange={(_, val) => {
                        setInputValue(val)
                        setIsUserInput(true)
                    }}
                    // onKeyDown={onInputKeyDown}
                    id="variables-dropdown-input"
                    autoComplete="off"
                    placeholder={placeholder}
                    role="combobox"
                    isExpanded={isOpen}
                    aria-controls="variables-dropdown-listbox"
                />
            </TextInputGroup>
        </MenuToggle>
    )

    const onSelect = (ev: React.MouseEvent<Element, MouseEvent> | undefined, itemId: string | number | undefined) => {
        if (typeof itemId === 'number' || typeof itemId === 'undefined') {
            return;
        }
        setInputValue(itemId)
        setIsUserInput(true)
        onPropertyChange?.(property.name, itemId);
        setIsOpen(!isOpen);
    };

    return (
        <TextInputGroup className={"input-group " + valueChangedClassName}>
            <Dropdown
                style={{width: '300px'}}
                isOpen={isOpen}
                onOpenChange={(isOpen) => setIsOpen(isOpen)}
                onOpenChangeKeys={['Escape']}
                toggle={toggle}
                ref={menuRef}
                id="context-selector"
                onSelect={onSelect}
                isScrollable
            >
                <DropdownList>
                    {selectOptions.filter(v => v.value?.includes(inputValue ?? '')).map((item, index) => {
                        return (
                            <DropdownItem itemId={item.value} key={index} description={item.description}>
                                {item.children}
                            </DropdownItem>
                        );
                    })}
                </DropdownList>
            </Dropdown>
            <TextInputGroupUtilities>
                <Button icon={<TimesIcon/>} variant="plain"
                        onClick={e => {
                            onPropertyChange?.(property.name, undefined)
                            setInputValue(undefined)
                            setIsUserInput(true)
                        }} aria-label="Delete"/>
            </TextInputGroupUtilities>
        </TextInputGroup>
    )
}