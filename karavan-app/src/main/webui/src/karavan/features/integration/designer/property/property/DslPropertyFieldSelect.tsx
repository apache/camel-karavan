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
import React, {ReactElement, useState} from 'react';
import {Button, MenuToggle, MenuToggleElement, Select, SelectList, SelectOption, SelectOptionProps, TextInputGroup, TextInputGroupUtilities, Tooltip} from '@patternfly/react-core';
import {PropertyMeta} from "@karavan-core/model/CamelMetadata";
import {RouteToCreate} from "../../utils/CamelUi";
import {PropertyUtil} from "./PropertyUtil";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";

interface Props {
    property: PropertyMeta,
    value?: any,
    selectOptions: SelectOptionProps[],
    onPropertyChange?: (fieldId: string, value: string | number | boolean | any, newRoute?: RouteToCreate) => void,
    utilities?: ReactElement[]
    placeholder?: string
}

export function DslPropertyFieldSelect(props: Props) {

    const {property, onPropertyChange, value, selectOptions, utilities, placeholder} = props;
    const [isOpen, setIsOpen] = useState(false);
    const valueChangedClassName = PropertyUtil.hasDslPropertyValueChanged(property, value) ? 'value-changed' : '';

    const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
            ref={toggleRef}
            onClick={() => setIsOpen(!isOpen)}
            isExpanded={isOpen}
            style={{width: '100%'}}
        >
            {`${value ? value :  (placeholder ?? "Select " +property.displayName)}`}
        </MenuToggle>
    )

    return (
        <TextInputGroup className={"input-group " + valueChangedClassName}>
            <Select
                className={valueChangedClassName}
                aria-label={property.name}
                toggle={toggle}
                isOpen={isOpen}
                id={property.name}
                aria-labelledby={property.name}
                shouldFocusToggleOnSelect
                onOpenChange={(isOpen) => setIsOpen(isOpen)}
                onSelect={(_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
                    onPropertyChange?.(property.name, value);
                    setIsOpen(false)
                }}
            >
                <SelectList>
                    {selectOptions.map((option, index) => <SelectOption value={option.value} key={index} description={option.description ?? ''}>{option.children}</SelectOption>)}
                </SelectList>
            </Select>
            <TextInputGroupUtilities>
                <Tooltip key={0} position="bottom" content={"Clear"}>
                    <Button icon={<TimesIcon/>} variant="plain"
                            onClick={e => onPropertyChange?.(property.name, undefined)}
                            aria-label="Delete"
                    />
                    </Tooltip>
                {utilities}
            </TextInputGroupUtilities>
        </TextInputGroup>
    )
}