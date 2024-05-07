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
    DropdownGroup
} from '@patternfly/react-core';
import '../../karavan.css';
import './VariablesDropdown.css';
import "@patternfly/patternfly/patternfly.css";
import {useIntegrationStore} from "../../DesignerStore";
import {shallow} from "zustand/shallow";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";

interface Props {
    onVariableChange: (name: string) => void,
}

export function VariablesDropdown(props: Props) {

    const [variables, getVariables] = useIntegrationStore((s) => [s.variables, s.getVariables], shallow)
    const [isOpenVariablesDropdown, setOpenVariablesDropdown] = useState<boolean>(false);

    const hasVariables = (variables && variables.length > 0 );

    function parametersChanged(name: string ) {
        props.onVariableChange(name);
    }

    function onMenuToggleClick() {
        setOpenVariablesDropdown(!isOpenVariablesDropdown)
    }


    function getToggle(toggleRef: React.Ref<MenuToggleElement>) {
        return (
            <MenuToggle className="variables-toggle"
                        ref={toggleRef}
                        aria-label="variables menu"
                        variant="default"
                        onClick={() => onMenuToggleClick()}
                        isExpanded={isOpenVariablesDropdown}
            >
                <EllipsisVIcon/>
            </MenuToggle>
        )
    }

    return (
        <Dropdown
            popperProps={{position: "end"}}
            isOpen={isOpenVariablesDropdown}
            onSelect={(_, value) => {
                if (value) {
                    parametersChanged(value?.toString());
                    setOpenVariablesDropdown(false);
                }
            }}
            onOpenChange={(isOpen: boolean) => setOpenVariablesDropdown(isOpen)}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => getToggle(toggleRef)}
            shouldFocusToggleOnSelect
        >
            <DropdownList>
                {hasVariables && <DropdownGroup label="Variables">
                    {getVariables().map((pp, index) =>
                        <DropdownItem value={pp} key={index}>{pp}</DropdownItem>
                    )}
                </DropdownGroup>}
            </DropdownList>
        </Dropdown>
    )
}
