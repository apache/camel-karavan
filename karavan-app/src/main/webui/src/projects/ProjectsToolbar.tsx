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
    Toolbar,
    ToolbarContent,
    ToolbarItem,
    TextInput,
    Button,
} from '@patternfly/react-core';
import './ProjectsPage.css';
import PlusIcon from '@patternfly/react-icons/dist/esm/icons/plus-icon';
import {useProjectsStore, useProjectStore} from "../api/ProjectStore";
import {Project} from "../api/ProjectModels";
import {shallow} from "zustand/shallow";
import RefreshIcon from "@patternfly/react-icons/dist/esm/icons/sync-alt-icon";
import {ProjectService} from "../api/ProjectService";

export function ProjectsToolbar () {

    const [filter, setFilter] = useProjectsStore((s) => [s.filter, s.setFilter], shallow)
    const [setProject] = useProjectStore((s) => [s.setProject], shallow)

    return (
        <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                <ToolbarItem>
                    <Button icon={<RefreshIcon/>}
                            variant={"link"}
                            onClick={e => ProjectService.refreshProjects()}
                    />
                </ToolbarItem>
                <ToolbarItem>
                    <TextInput className="text-field" type="search" id="search" name="search"
                               autoComplete="off" placeholder="Search by name"
                               value={filter}
                               onChange={(_, e) => setFilter(e)}/>
                </ToolbarItem>
                <ToolbarItem>
                    <Button className="dev-action-button"
                            icon={<PlusIcon/>}
                            onClick={e =>
                                setProject(new Project(), 'create')}
                    >Create</Button>
                </ToolbarItem>
            </ToolbarContent>
        </Toolbar>
    )
}