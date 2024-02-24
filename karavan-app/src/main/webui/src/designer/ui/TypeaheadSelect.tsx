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
    Select,
    SelectOption,
    SelectList,
    SelectOptionProps,
    MenuToggle,
    MenuToggleElement,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    Button
} from '@patternfly/react-core';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';

export interface Value {
    value: string
    children: string
}

interface Props {
    listOfValues: Value[]
    onSelect: (value: string) => void
}

export function TypeaheadSelect(props: Props)  {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string>('');
    const [inputValue, setInputValue] = React.useState<string>('');
    const [filterValue, setFilterValue] = React.useState<string>('');
    const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>(props.listOfValues);
    const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | undefined>(undefined);
    const [activeItem, setActiveItem] = React.useState<string | undefined>(undefined);
    const textInputRef = React.useRef<HTMLInputElement>();

    React.useEffect(() => {
        let newSelectOptions: SelectOptionProps[] = props.listOfValues;

        // Filter menu items based on the text input value when one exists
        if (filterValue) {
            newSelectOptions = props.listOfValues.filter((menuItem) =>
                String(menuItem.children).toLowerCase().includes(filterValue.toLowerCase())
            );

            // When no options are found after filtering, display 'No results found'
            if (!newSelectOptions.length) {
                newSelectOptions = [
                    { isDisabled: false, children: `No results found for "${filterValue}"`, value: 'no results' }
                ];
            }

            // Open the menu when the input value changes and the new value is not empty
            if (!isOpen) {
                setIsOpen(true);
            }
        }

        setSelectOptions(newSelectOptions);
        setActiveItem(undefined);
        setFocusedItemIndex(undefined);
    }, [filterValue]);

    const onToggleClick = () => {
        setIsOpen(!isOpen);
    };

    const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
        if (value) {
            props.onSelect( value.toString())
        }

        if (value && value !== 'no results') {
            setInputValue(value as string);
            setFilterValue('');
            const text = props.listOfValues.filter(v => v.value === value).at(0)?.children;
            setSelected(text || value.toString());
            setInputValue(text || value.toString());
        }
        setIsOpen(false);
        setFocusedItemIndex(undefined);
        setActiveItem(undefined);
    };

    const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
        setInputValue(value);
        setFilterValue(value);
    };

    const handleMenuArrowKeys = (key: string) => {
        let indexToFocus;

        if (isOpen) {
            if (key === 'ArrowUp') {
                // When no index is set or at the first index, focus to the last, otherwise decrement focus index
                if (focusedItemIndex === undefined || focusedItemIndex === 0) {
                    indexToFocus = selectOptions.length - 1;
                } else {
                    indexToFocus = focusedItemIndex - 1;
                }
            }

            if (key === 'ArrowDown') {
                // When no index is set or at the last index, focus to the first, otherwise increment focus index
                if (focusedItemIndex === undefined || focusedItemIndex === selectOptions.length - 1) {
                    indexToFocus = 0;
                } else {
                    indexToFocus = focusedItemIndex + 1;
                }
            }

            if (indexToFocus !== undefined) {
                setFocusedItemIndex(indexToFocus);
                const focusedItem = selectOptions[indexToFocus];
                setActiveItem(`select-typeahead-${focusedItem.value}`);
            }
        }
    };

    const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const enabledMenuItems = selectOptions.filter((option) => !option.isDisabled);
        const [firstMenuItem] = enabledMenuItems;
        const focusedItem = focusedItemIndex ? enabledMenuItems[focusedItemIndex] : firstMenuItem;

        switch (event.key) {
            // Select the first available option
            case 'Enter':
                if (isOpen && focusedItem.value !== 'no results') {
                    setInputValue(String(focusedItem.children));
                    setFilterValue('');
                    setSelected(String(focusedItem.children));
                    props.onSelect(focusedItem.value)
                }

                setIsOpen((prevIsOpen) => !prevIsOpen);
                setFocusedItemIndex(undefined);
                setActiveItem(undefined);

                break;
            case 'Tab':
            case 'Escape':
                setIsOpen(false);
                setActiveItem(undefined);
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                event.preventDefault();
                handleMenuArrowKeys(event.key);
                break;
        }
    };

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} variant="typeahead" onClick={onToggleClick} isExpanded={isOpen} isFullWidth>
            <TextInputGroup isPlain>
                <TextInputGroupMain
                    value={inputValue}
                    onClick={onToggleClick}
                    onChange={onTextInputChange}
                    onKeyDown={onInputKeyDown}
                    id="typeahead-select-input"
                    autoComplete="off"
                    innerRef={textInputRef}
                    placeholder="Select a state"
                    {...(activeItem && { 'aria-activedescendant': activeItem })}
                    role="combobox"
                    isExpanded={isOpen}
                    aria-controls="select-typeahead-listbox"
                />

                <TextInputGroupUtilities>
                    {!!inputValue && (
                        <Button
                            variant="plain"
                            onClick={() => {
                                setSelected('');
                                setInputValue('');
                                setFilterValue('');
                                textInputRef?.current?.focus();
                            }}
                            aria-label="Clear input value"
                        >
                            <TimesIcon aria-hidden />
                        </Button>
                    )}
                </TextInputGroupUtilities>
            </TextInputGroup>
        </MenuToggle>
    );

    return (
        <Select
            id="typeahead-select"
            isOpen={isOpen}
            selected={selected}
            onSelect={onSelect}
            onOpenChange={() => {
                setIsOpen(false);
            }}
            toggle={toggle}
        >
            <SelectList id="select-typeahead-listbox">
                {selectOptions.map((option, index) => (
                    <SelectOption
                        key={option.value || option.children}
                        isFocused={focusedItemIndex === index}
                        className={option.className}
                        onClick={() => setSelected(option.value)}
                        id={`select-typeahead-${option.value}`}
                        {...option}
                        ref={null}
                    />
                ))}
            </SelectList>
        </Select>
    );
};
