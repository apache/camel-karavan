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
    Select,
    SelectOption,
    SelectList,
    SelectOptionProps,
    MenuToggle,
    MenuToggleElement,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
    Button, InputGroupItem, ToggleGroup, ToggleGroupItem,
    InputGroup
} from '@patternfly/react-core';
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon';
import {GLOBAL, ROUTE} from "karavan-core/lib/api/VariableUtil";

interface VariablesDropdownProps {
    initialValue?: string;
    options: SelectOptionProps[];
    valueChangedClassName: string;
    placeholder?: string;
    onChange: (variableType: string, variableName: string) => void;
}

export const VariablesDropdown: React.FC<VariablesDropdownProps> = ({
                                                                        initialValue = '',
                                                                        options,
                                                                        valueChangedClassName,
                                                                        placeholder = 'Select a value',
                                                                        onChange
                                                                    }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [isUserInput, setIsUserInput] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(initialValue);
    const [variableType, setVariableType] = useState<'global:' | 'route:' | ''>('');
    const [selected, setSelected] = React.useState(initialValue);
    const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>(options);
    const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
    const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
    const textInputRef = React.useRef<HTMLInputElement>(null);

    const CREATE_NEW = 'create';

    React.useEffect(() => {
        if (initialValue?.toString().startsWith(GLOBAL)) {
            setInputValue(initialValue.toString().replace(GLOBAL, ''));
            setSelected(initialValue);
            setVariableType(GLOBAL);
        } else if (initialValue?.toString().startsWith(ROUTE)) {
            setInputValue(initialValue.toString().replace(ROUTE, ''));
            setSelected(initialValue);
            setVariableType(ROUTE);
        } else {
            setVariableType('');
            setInputValue(initialValue?.toString());
            setSelected(initialValue);
        }
        setIsUserInput(false)
    }, [initialValue])

    React.useEffect(() => {
        let filteredOptions = options;

        if (inputValue) {
            filteredOptions = options.filter((item) =>
                String(item.children).toLowerCase().includes(inputValue.toLowerCase())
            );

            if (!options.some((opt) => opt.value === inputValue)) {
                filteredOptions.push({
                    value: CREATE_NEW,
                    children: `Create variable "${inputValue}"`
                });
            }

            if (!isOpen && isUserInput) {
                setIsOpen(true);
            }
        }

        setSelectOptions(filteredOptions);
    }, [inputValue, options]);

    const createItemId = (value: string) => `select-typeahead-${value.replace(/\s+/g, '-')}`;

    const setActiveAndFocusedItem = (index: number) => {
        setFocusedItemIndex(index);
        const focusedItem = selectOptions[index];
        setActiveItemId(createItemId(focusedItem.value?.toString() ?? ''));
    };

    const resetActiveAndFocusedItem = () => {
        setFocusedItemIndex(null);
        setActiveItemId(null);
    };

    const closeMenu = () => {
        setIsOpen(false);
        resetActiveAndFocusedItem();
    };

    const onSelect = (
        _event: React.MouseEvent<Element, MouseEvent> | undefined,
        selectedValue: string | number | undefined
    ) => {
        if (!selectedValue) return;

        if (selectedValue === CREATE_NEW && inputValue) {
            onChange(variableType, inputValue);
            setSelected(inputValue);
        } else {
            const label = selectOptions.find((opt) => opt.value === selectedValue)?.children;
            onChange(variableType, String(selectedValue));
            setSelected(String(selectedValue));
            setInputValue(String(label));
        }

        closeMenu();
    };

    const handleMenuArrowKeys = (key: string) => {
        let indexToFocus = 0;

        if (!isOpen) setIsOpen(true);
        if (selectOptions.every((opt) => opt.isDisabled)) return;

        if (key === 'ArrowUp') {
            indexToFocus =
                focusedItemIndex === null || focusedItemIndex === 0
                    ? selectOptions.length - 1
                    : focusedItemIndex - 1;
            while (selectOptions[indexToFocus].isDisabled) {
                indexToFocus = (indexToFocus - 1 + selectOptions.length) % selectOptions.length;
            }
        }

        if (key === 'ArrowDown') {
            indexToFocus =
                focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1
                    ? 0
                    : focusedItemIndex + 1;
            while (selectOptions[indexToFocus].isDisabled) {
                indexToFocus = (indexToFocus + 1) % selectOptions.length;
            }
        }

        setActiveAndFocusedItem(indexToFocus);
    };

    const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        const focusedItem = focusedItemIndex !== null ? selectOptions[focusedItemIndex] : null;
        switch (event.key) {
            case 'Enter':
                if (isOpen && focusedItem && !focusedItem.isAriaDisabled) {
                    onSelect(undefined, focusedItem.value as string);
                } else if (isOpen && focusedItem === null) {
                    onChange?.(variableType, inputValue);
                    setSelected(inputValue);
                    setIsUserInput(false);
                    closeMenu();
                } else {
                    setIsOpen(true);
                }
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                event.preventDefault();
                handleMenuArrowKeys(event.key);
                break;
        }
    };

    const onClearButtonClick = () => {
        setSelected('');
        setInputValue('');
        resetActiveAndFocusedItem();
        textInputRef.current?.focus();
        onChange('', '');
    };

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
            ref={toggleRef}
            variant="typeahead"
            aria-label="Typeahead creatable menu toggle"
            onClick={() => setIsOpen(!isOpen)}
            isExpanded={isOpen}
            isFullWidth
        >
            <TextInputGroup isPlain>
                <TextInputGroupMain
                    value={inputValue}
                    onClick={() => setIsOpen(true)}
                    onChange={(_, val) => {
                        setInputValue(val)
                        setIsUserInput(true)
                    }}
                    onKeyDown={onInputKeyDown}
                    id="variables-dropdown-input"
                    autoComplete="off"
                    innerRef={textInputRef}
                    placeholder={placeholder}
                    {...(activeItemId && { 'aria-activedescendant': activeItemId })}
                    role="combobox"
                    isExpanded={isOpen}
                    aria-controls="variables-dropdown-listbox"
                />
                <TextInputGroupUtilities {...(!inputValue ? { style: { display: 'none' } } : {})}>
                    <Button variant="plain" onClick={onClearButtonClick} aria-label="Clear input value">
                        <TimesIcon aria-hidden />
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        </MenuToggle>
    );

    return (
        <InputGroup className={valueChangedClassName}>
            <InputGroupItem>
                <ToggleGroup aria-label="Variable type">
                    <ToggleGroupItem text="global:" key='global' buttonId={"global-variable"}
                                     isSelected={variableType === GLOBAL}
                                     onChange={(_, selected) => {
                                         if (selected) {
                                             setVariableType(GLOBAL);
                                             onChange(GLOBAL, inputValue);
                                         } else {
                                             setVariableType('');
                                             onChange('', inputValue);
                                         }
                                     }}
                    />
                    <ToggleGroupItem text="route:" key='route' buttonId={"route-variable"}
                                     className='route-variable'
                                     isSelected={variableType === ROUTE}
                                     onChange={(_, selected) => {
                                         if (selected) {
                                             setVariableType(ROUTE);
                                             onChange(ROUTE, inputValue);
                                         } else {
                                             setVariableType('');
                                             onChange('', inputValue);
                                         }
                                     }}
                    />
                </ToggleGroup>
            </InputGroupItem>
            <InputGroupItem isFill>
                <Select
                    id="variables-dropdown"
                    isOpen={isOpen}
                    selected={selected}
                    onSelect={onSelect}
                    onOpenChange={(nextOpen) => !nextOpen && closeMenu()}
                    toggle={toggle}
                    shouldFocusFirstItemOnOpen={false}
                >
                    <SelectList id="variables-dropdown-listbox">
                        {selectOptions.map((option, index) => (
                            <SelectOption
                                key={option.value || option.children}
                                isFocused={focusedItemIndex === index}
                                className={option.className}
                                id={createItemId(option.value?.toString() || '')}
                                {...option}
                                ref={null}
                            />
                        ))}
                    </SelectList>
                </Select>
            </InputGroupItem>
        </InputGroup>
    );
};


