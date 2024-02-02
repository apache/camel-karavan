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
import './BeanFilesDropdown.css';
import "@patternfly/patternfly/patternfly.css";
import {shallow} from "zustand/shallow";
import EllipsisVIcon from "@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon";
import {useFilesStore} from "../../api/ProjectStore";

const CAMEL_YAML_EXT = ".camel.yaml";

interface Props {
    onSelect: (filename: string, event?: React.MouseEvent<Element, MouseEvent>) => void;
}

export function BeanFilesDropdown(props: Props) {

    const [files] = useFilesStore((s) => [s.files], shallow);
    const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);

    function onMenuToggleClick() {
        setIsOpenDropdown(!isOpenDropdown)
    }

    function getToggle(toggleRef: React.Ref<MenuToggleElement>) {
        return (
            <MenuToggle className="bean-wizard-toggle"
                        id={'popoverId'}
                        ref={toggleRef}
                        aria-label="placeholder menu"
                        variant="default"
                        onClick={() => onMenuToggleClick()}
                        isExpanded={isOpenDropdown}
            >
                <EllipsisVIcon/>
            </MenuToggle>
        )
    }

    const camelYamlFiles = files.filter(f => f.name.endsWith(CAMEL_YAML_EXT)).map(f => f.name);

    return (
        (files && files.length > 0 ) ?
            <Dropdown
                popperProps={{position: "end"}}
                isOpen={isOpenDropdown}
                onSelect={(e, value) => {
                    if (value) {
                        props.onSelect(value?.toString().replace(CAMEL_YAML_EXT, ''), e);
                    }
                    setIsOpenDropdown(false);
                }}
                onOpenChange={(isOpen: boolean) => setIsOpenDropdown(isOpen)}
                toggle={(toggleRef: React.Ref<MenuToggleElement>) => getToggle(toggleRef)}
                shouldFocusToggleOnSelect
            >
                <DropdownList>
                    {camelYamlFiles.map((pp, index) =>
                        <DropdownItem value={pp} key={index}>{pp}</DropdownItem>
                    )}
                </DropdownList>
            </Dropdown>
            : <></>
    )
}
