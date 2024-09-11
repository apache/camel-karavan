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

interface Props {
    id: string
    name: string
    value?: string
    placeholder: string
    onChange: (name: string, value: string | number | undefined) => void,
    selectOptions: SelectOptionProps[]
}

export function SelectField(props: Props) {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string>(props.value || '');
    const [inputValue, setInputValue] = React.useState<string>();
    const [filterValue, setFilterValue] = React.useState<string>('');
    const [selectOptions, setSelectOptions] = React.useState<SelectOptionProps[]>([]);
    const [focusedItemIndex, setFocusedItemIndex] = React.useState<number | null>(null);
    const [activeItemId, setActiveItemId] = React.useState<string | null>(null);
    const textInputRef = React.useRef<HTMLInputElement>();

    const CREATE_NEW = 'create';

    React.useEffect(() => {
        const v = props.selectOptions.filter(so => so.value === props.value)?.at(0)?.children?.toString() || '';
        setInputValue(v);
    }, []);

    React.useEffect(() => {
        let initialSelectOptions = props.selectOptions;
        let newSelectOptions: SelectOptionProps[] = initialSelectOptions;

        // Filter menu items based on the text input value when one exists
        if (filterValue) {
            newSelectOptions = props.selectOptions.filter((menuItem) =>
                String(menuItem.children).toLowerCase().includes(filterValue.toLowerCase())
            );

            // If no option matches the filter exactly, display creation option
            if (!initialSelectOptions.some((option) => option.value === filterValue)) {
                newSelectOptions = [...newSelectOptions, {
                    children: `Create new option "${filterValue}"`,
                    value: filterValue
                }];
            }

            // Open the menu when the input value changes and the new value is not empty
            if (!isOpen) {
                setIsOpen(true);
            }
        }

        setSelectOptions(newSelectOptions);
    }, [filterValue]);

    const createItemId = (value: any) => `select-typeahead-${value.replace(' ', '-')}`;

    const setActiveAndFocusedItem = (itemIndex: number) => {
        setFocusedItemIndex(itemIndex);
        const focusedItem = selectOptions[itemIndex];
        setActiveItemId(createItemId(focusedItem.value));
    };

    const resetActiveAndFocusedItem = () => {
        setFocusedItemIndex(null);
        setActiveItemId(null);
    };

    const closeMenu = () => {
        setIsOpen(false);
        resetActiveAndFocusedItem();
    };

    const onInputClick = () => {
        if (!isOpen) {
            setIsOpen(true);
        } else if (!inputValue) {
            closeMenu();
        }
    };

    const selectOption = (value: string | number, content: string | number) => {
        // eslint-disable-next-line no-console
        console.log('selected', content);

        setInputValue(String(content));
        setFilterValue('');
        setSelected(String(value));

        closeMenu();
    };

    const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
        let initialSelectOptions = props.selectOptions;
        console.log("onselect", value)
        if (value) {
            if (value === CREATE_NEW) {
                if (!initialSelectOptions.some((item) => item.children === filterValue)) {
                    initialSelectOptions = [...initialSelectOptions, {value: filterValue, children: filterValue}];
                }
                setSelected(filterValue);
                setFilterValue('');
                closeMenu();
            } else {
                const optionText = selectOptions.find((option) => option.value === value)?.children;
                selectOption(value, optionText as string);
            }
        }
        props.onChange(props.name, value);
    };

    const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
        setInputValue(value);
        setFilterValue(value);

        resetActiveAndFocusedItem();

        if (value !== selected) {
            setSelected('');
        }
    };

    const handleMenuArrowKeys = (key: string) => {
        let indexToFocus = 0;

        if (!isOpen) {
            setIsOpen(true);
        }

        if (selectOptions.every((option) => option.isDisabled)) {
            return;
        }

        if (key === 'ArrowUp') {
            // When no index is set or at the first index, focus to the last, otherwise decrement focus index
            if (focusedItemIndex === null || focusedItemIndex === 0) {
                indexToFocus = selectOptions.length - 1;
            } else {
                indexToFocus = focusedItemIndex - 1;
            }

            // Skip disabled options
            while (selectOptions[indexToFocus].isDisabled) {
                indexToFocus--;
                if (indexToFocus === -1) {
                    indexToFocus = selectOptions.length - 1;
                }
            }
        }

        if (key === 'ArrowDown') {
            // When no index is set or at the last index, focus to the first, otherwise increment focus index
            if (focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1) {
                indexToFocus = 0;
            } else {
                indexToFocus = focusedItemIndex + 1;
            }

            // Skip disabled options
            while (selectOptions[indexToFocus].isDisabled) {
                indexToFocus++;
                if (indexToFocus === selectOptions.length) {
                    indexToFocus = 0;
                }
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
                }

                if (!isOpen) {
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

    const onToggleClick = () => {
        setIsOpen(!isOpen);
        textInputRef?.current?.focus();
    };

    const onClearButtonClick = () => {
        setSelected('');
        setInputValue('');
        setFilterValue('');
        resetActiveAndFocusedItem();
        textInputRef?.current?.focus();
    };

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
            ref={toggleRef}
            variant="typeahead"
            aria-label="Typeahead creatable menu toggle"
            onClick={onToggleClick}
            isExpanded={isOpen}
            isFullWidth
        >
            <TextInputGroup isPlain>
                <TextInputGroupMain
                    value={inputValue}
                    onClick={onInputClick}
                    onChange={onTextInputChange}
                    onKeyDown={onInputKeyDown}
                    id="create-typeahead-select-input"
                    autoComplete="off"
                    innerRef={textInputRef}
                    placeholder={props.placeholder}
                    {...(activeItemId && {'aria-activedescendant': activeItemId})}
                    role="combobox"
                    isExpanded={isOpen}
                    aria-controls="select-create-typeahead-listbox"
                />

                <TextInputGroupUtilities {...(!inputValue ? {style: {display: 'none'}} : {})}>
                    <Button variant="plain" onClick={onClearButtonClick} aria-label="Clear input value">
                        <TimesIcon aria-hidden/>
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        </MenuToggle>
    );

    return (
        <Select
            id="create-typeahead-select"
            isOpen={isOpen}
            selected={selected}
            onSelect={onSelect}
            onOpenChange={(isOpen) => {
                !isOpen && closeMenu();
            }}
            toggle={toggle}
            shouldFocusToggleOnSelect={false}
        >
            <SelectList id="select-create-typeahead-listbox">
                {selectOptions.map((option, index) => {
                        return <SelectOption
                            key={option.value}
                            isFocused={focusedItemIndex === index}
                            className={option.className}
                            id={createItemId(option.value)}
                            selected={option.value === props.value}
                            isSelected={option.value === props.value}
                            {...option}
                            ref={null}
                        />
                    }
                )}
            </SelectList>
        </Select>
    );
};
