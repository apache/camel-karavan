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
import React, {ReactElement} from 'react';
import {
    Button,
    InputGroup,
    InputGroupItem,
    MenuToggle,
    MenuToggleElement,
    Select,
    SelectList,
    SelectOption,
    SelectOptionProps,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities
} from '@patternfly/react-core';
import {TimesIcon} from '@patternfly/react-icons';
import "./FileReferenceDropdown.css"

interface FileReferenceDropdownProps {
    initialValue?: string;
    options: SelectOptionProps[];
    valueChangedClassName: string;
    placeholder?: string;
    inputLanguage?: string;
    onChange: (text: string) => void;
    onFileReferenceClick: (text: string) => void;
    additionalItems?: ReactElement[];
}

export const FileReferenceDropdown: React.FC<FileReferenceDropdownProps> = ({
                                                                        initialValue = '',
                                                                        options,
                                                                        valueChangedClassName,
                                                                        placeholder = 'Select file',
                                                                        inputLanguage,
                                                                        additionalItems,
                                                                        onChange,
                                                                        onFileReferenceClick
                                                                    }) => {

    const [isOpen, setIsOpen] = React.useState(false);
    const [isReference, setIsReference] = React.useState(false);
    const [isUserInput, setIsUserInput] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(initialValue);
    const [selected, setSelected] = React.useState(initialValue);
    const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>(options);
    const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
    const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
    const textInputRef = React.useRef<HTMLInputElement>(null);

    const CREATE_NEW = 'CREATE_NEW_DEFAULT_NAME';
    const FILE_PREFIX_FULL = 'resource:';

    React.useEffect(() => {
        setIsReference(initialValue?.startsWith(FILE_PREFIX_FULL));
        setInputValue(initialValue?.toString());
        setSelected(initialValue);
        setIsUserInput(false)
    }, [initialValue])

    React.useEffect(() => {
        let filteredOptions = options;

        if (inputValue?.length > 0) {
            filteredOptions = options.filter((item) =>
                String(item.children).toLowerCase().includes(inputValue.toLowerCase())
            );

            if (!options.some((opt) => opt.value === inputValue) && inputValue?.endsWith("." + inputLanguage)) {
                filteredOptions.unshift({
                    value: CREATE_NEW,
                    children: `Create file "${inputValue}"`
                });
            }

            if (!isOpen && isUserInput && filteredOptions.length > 0) {
                setIsOpen(true);
            }
            if (selected === inputValue) {
                setIsOpen(false);
            }
        } else {
            setIsOpen(false);
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
        resetActiveAndFocusedItem();
        setIsOpen(false);
    };

    const onSelect = (
        _event: React.MouseEvent<Element, MouseEvent> | undefined,
        selectedValue: string | number | undefined
    ) => {
        if (!selectedValue) return;
        if (selectedValue === CREATE_NEW && inputValue) {
            onChange(inputValue);
            setSelected(inputValue);
        } else {
            const label = selectOptions.find((opt) => opt.value === selectedValue)?.children;
            onChange(String(selectedValue));
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
                    onChange?.(inputValue);
                    setSelected(inputValue);
                    setIsUserInput(false);
                    closeMenu();
                } else if (inputValue?.length > 0){
                    setIsOpen(true);
                } else {
                    onChange?.(inputValue);
                    setIsOpen(false);
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
        onChange( '');
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
                    onBlur={event => {
                        onChange(inputValue)
                    }}
                    onKeyDown={onInputKeyDown}
                    id="file-reference-dropdown-input"
                    autoComplete="off"
                    innerRef={textInputRef}
                    placeholder={placeholder}
                    {...(activeItemId && { 'aria-activedescendant': activeItemId })}
                    role="combobox"
                    isExpanded={isOpen}
                    aria-controls="file-reference-dropdown-listbox"
                />
                <TextInputGroupUtilities {...(!inputValue ? { style: { display: 'none' } } : {})}>
                    <Button icon={<TimesIcon aria-hidden />} variant="plain" onClick={onClearButtonClick} aria-label="Clear input value" />
                </TextInputGroupUtilities>
            </TextInputGroup>
        </MenuToggle>
    );

    function getSelector() {
        return (
            <InputGroup className={valueChangedClassName}>
                <InputGroupItem isFill>
                    <Select
                        id="file-reference-dropdown"
                        isOpen={isOpen}
                        selected={selected}
                        onSelect={onSelect}
                        onOpenChange={(nextOpen) => !nextOpen && closeMenu()}
                        toggle={toggle}
                        shouldFocusFirstItemOnOpen={false}
                    >
                        <SelectList id="file-reference-dropdown-listbox">
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
                {additionalItems?.map((item, index) =>
                    <InputGroupItem key={index}>
                        {item}
                    </InputGroupItem>
                )}
            </InputGroup>
        )
    }

    function getLink() {
        return (
            <InputGroup className={`file-reference-button ${valueChangedClassName}`}>
                <InputGroupItem isFill>
                    <Button variant='link' onClick={_ => {
                        onFileReferenceClick(inputValue)
                    }}>{inputValue?.replace(FILE_PREFIX_FULL, '')}</Button>
                </InputGroupItem>
                <InputGroupItem>
                    <Button variant='plain' icon={<TimesIcon/>} onClick={onClearButtonClick}/>
                </InputGroupItem>
            </InputGroup>
        )
    }

    return isReference ? getLink() : getSelector();
};


