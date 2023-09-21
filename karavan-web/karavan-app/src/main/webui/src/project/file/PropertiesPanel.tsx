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
    PageSection, PanelHeader, Panel
} from '@patternfly/react-core';
import '../../designer/karavan.css';
import { useProjectStore} from "../../api/ProjectStore";
import { ProjectFileTypes} from "../../api/ProjectModels";
import {shallow} from "zustand/shallow";
import {PropertiesToolbar} from "./PropertiesToolbar";
import {PropertiesTable} from "./PropertiesTable";

export function PropertiesPanel () {

    const [project] = useProjectStore((s) => [s.project], shallow);

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    function canDeleteFiles(): boolean {
        return !['templates', 'services'].includes(project.projectId);
    }

    function isKameletsProject(): boolean {
        return project.projectId === 'kamelets';
    }

    const types = isBuildIn()
        ? (isKameletsProject() ? ['KAMELET'] : ['CODE', 'PROPERTIES'])
        : ProjectFileTypes.filter(p => !['PROPERTIES', 'LOG', 'KAMELET'].includes(p.name)).map(p => p.name);

    return (
        <PageSection padding={{default: 'noPadding'}} className="scrollable-out">
            <PageSection isFilled padding={{default: 'padding'}} className="scrollable-in">
            <Panel>
                <PanelHeader>
                    <PropertiesToolbar/>
                </PanelHeader>
            </Panel>
                <PropertiesTable/>
        </PageSection>
        </PageSection>
    )
}
