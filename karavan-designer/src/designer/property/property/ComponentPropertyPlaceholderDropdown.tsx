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
    DropdownList, DropdownItem
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


interface Props {
    property: ComponentProperty,
}

export function ComponentPropertyPlaceholderDropdown(props: Props) {

    const {onParametersChange} = usePropertiesHook();
    const [propertyPlaceholders] = useDesignerStore((s) => [s.propertyPlaceholders], shallow)
    const [isOpenPlaceholdersDropdown, setOpenPlaceholdersDropdown] = useState<boolean>(false);

    function parametersChanged(parameter: string, value: string | number | boolean | any, pathParameter?: boolean, newRoute?: RouteToCreate) {
        onParametersChange(parameter, value, pathParameter, newRoute);
    }

    const property: ComponentProperty = props.property;
    return (
        propertyPlaceholders && propertyPlaceholders.length > 0 ?
            <Dropdown
                popperProps={{position: "end"}}
                isOpen={isOpenPlaceholdersDropdown}
                onSelect={(_, value) => {
                    parametersChanged(property.name, `{{${value}}}`, property.kind === 'path')
                    setOpenPlaceholdersDropdown(false);
                }}
                onOpenChange={(isOpen: boolean) => setOpenPlaceholdersDropdown(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle className="property-placeholder-toggle"
                                ref={toggleRef}
                                aria-label="placeholder menu"
                                variant="default"
                                onClick={() => setOpenPlaceholdersDropdown(!isOpenPlaceholdersDropdown)}
                                isExpanded={isOpenPlaceholdersDropdown}
                    >
                        <EllipsisVIcon/>
                    </MenuToggle>
                )}
                shouldFocusToggleOnSelect
            >
                <DropdownList>
                    {propertyPlaceholders.map((pp, index) =>
                        <DropdownItem value={pp} key={index}>{pp}</DropdownItem>
                    )}
                </DropdownList>
            </Dropdown>
            : <></>
    )
}
