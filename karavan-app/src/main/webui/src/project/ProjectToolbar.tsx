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
    Toolbar,
    ToolbarContent,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {DevModeToolbar} from "./DevModeToolbar";
import {useAppConfigStore, useFileStore, useProjectStore} from "../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {EditorToolbar} from "../editor/EditorToolbar";
import {BUILD_IN_PROJECTS,} from "../api/ProjectModels";
import {ResourceToolbar} from "./ResourceToolbar";

export function ProjectToolbar() {

    const [project] = useProjectStore((s) => [s.project, s.tabIndex], shallow)
    const [file] = useFileStore((state) => [state.file], shallow)
    const [config] = useAppConfigStore((s) => [s.config], shallow);
    const isDev = config.environment === 'dev';

    const isBuildInProject = BUILD_IN_PROJECTS.includes(project.projectId);

    useEffect(() => {
    }, [project, file]);

    function isFile(): boolean {
        return file !== undefined;
    }


    function getProjectToolbar() {
        return (<Toolbar id="toolbar-group-types">
            <ToolbarContent>
                {!isBuildInProject && isDev && <DevModeToolbar/>}
                {(isBuildInProject || !isDev) && <ResourceToolbar/>}
            </ToolbarContent>
        </Toolbar>)
    }

    return isFile() ? <EditorToolbar/> : getProjectToolbar();
}
