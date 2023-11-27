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
    FlexItem, PageSection
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {FilesTab} from "./files/FilesTab";
import {useAppConfigStore, useProjectStore} from "../api/ProjectStore";
import {DashboardTab} from "./dashboard/DashboardTab";
import {TraceTab} from "./trace/TraceTab";
import {ProjectBuildTab} from "./builder/ProjectBuildTab";
import {ProjectService} from "../api/ProjectService";
import {shallow} from "zustand/shallow";
import {ImagesPanel} from "./builder/ImagesPanel";
import {ProjectContainerTab} from "./container/ProjectContainerTab";
import {ProjectTopologyTab} from "./topology/ProjectTopologyTab";

export function ProjectPanel() {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const [project, tab, setTab] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);

    useEffect(() => {
        onRefresh();
    }, [project]);

    function onRefresh() {
        if (project.projectId) {
            ProjectService.refreshProjectData(project.projectId);
            setTab('files')
        }
    }

    function isBuildIn(): boolean {
        return ['kamelets', 'templates', 'services'].includes(project.projectId);
    }

    const buildIn = isBuildIn();
    const isTopology = tab === 'topology';
    return isTopology
        ? (<ProjectTopologyTab/>)
        : (<PageSection padding={{default: 'noPadding'}} className="scrollable-out">
            <PageSection isFilled padding={{default: 'noPadding'}} className="scrollable-in">
                <Flex direction={{default: "column"}} spaceItems={{default: "spaceItemsNone"}}>
                    {tab === 'files' && <FlexItem><FilesTab/></FlexItem>}
                    {!buildIn && tab === 'dashboard' && project && <FlexItem><DashboardTab/></FlexItem>}
                    {!buildIn && tab === 'trace' && project && <FlexItem><TraceTab/></FlexItem>}
                    {!buildIn && tab === 'build' && <FlexItem><ProjectBuildTab/></FlexItem>}
                    {!buildIn && tab === 'build' && config.infrastructure !== 'kubernetes' &&
                        <FlexItem><ImagesPanel/></FlexItem>}
                    {!buildIn && tab === 'container' && <FlexItem><ProjectContainerTab/></FlexItem>}
                    {!buildIn && tab === 'container' && config.infrastructure !== 'kubernetes' &&
                        <FlexItem><ImagesPanel/></FlexItem>}
                </Flex>
            </PageSection>
        </PageSection>)
}
