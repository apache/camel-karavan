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

import React, {useEffect} from 'react';
import {
    Flex,
    FlexItem,
    Toolbar,
    ToolbarContent,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {useFileStore, useProjectStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {DevModeToolbar} from "../project/DevModeToolbar";

export function EditorToolbar() {

    const [project, tabIndex] = useProjectStore((s) => [s.project, s.tabIndex], shallow)
    const [file] = useFileStore((state) => [state.file], shallow)

    useEffect(() => {
    }, [project, file]);

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    function isTemplatesProject(): boolean {
        return project.projectId === 'templates';
    }

    function isServicesProject(): boolean {
        return project.projectId === 'services';
    }

    function isRunnable(): boolean {
        return !isKameletsProject() && !isTemplatesProject() && !isServicesProject() && !['build', 'container'].includes(tabIndex.toString());
    }

    return (
        <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <Flex className="" direction={{default: "row"}}
                      justifyContent={{default: 'justifyContentSpaceBetween'}}
                      alignItems={{default: "alignItemsCenter"}}>
                    {isRunnable() &&
                        <FlexItem align={{default: 'alignRight'}}>
                            <DevModeToolbar reloadOnly={true}/>
                        </FlexItem>
                    }
                </Flex>
            </ToolbarContent>
        </Toolbar>
    )
}
