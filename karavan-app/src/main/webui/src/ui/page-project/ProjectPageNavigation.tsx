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
import React, {Fragment, JSX, useEffect, useState} from 'react';
import {capitalize, Divider, Tab, Tabs, TabTitleText,} from '@patternfly/react-core';
import './ProjectPage.css';
import {
    ProjectMenu,
    ProjectMenus,
    ProjectRuntimeMenu,
    ProjectRuntimeMenus,
    useAppConfigStore,
    useFilesStore,
    useFileStore,
    useProjectStore,
    useSelectedContainerStore
} from '@stores/ProjectStore';
import {BUILD_IN_PROJECTS} from '@models/ProjectModels';
import {ProjectContainersContext} from "./ProjectContainersContextProvider";
import {shallow} from "zustand/shallow";
import {useIntegrationStore} from "@designer/DesignerStore";

export function ProjectPageNavigation(): JSX.Element {

    const config = useAppConfigStore((s) => s.config);
    const context = React.useContext(ProjectContainersContext);
    if (!context) throw new Error("ProjectContainersContext not found!");

    const [selectedContainerName, setSelectedContainerName] = useSelectedContainerStore((s) => [s.selectedContainerName, s.setSelectedContainerName]);
    const {devModeIsRunning, packagedIsRunning, buildIsRunning, containerStatuses, devModeContainerStatus, camelContext, containersStatusIcons, packagedContainerStatuses} = context;
    const devContainer = containerStatuses?.filter(c => c.type === 'devmode')?.at(0)
    const hasDevmodeContainers = devContainer !== undefined;
    const buildContainer = containerStatuses?.filter(c => c.type === 'build')?.at(0)
    const hasBuildContainers = buildContainer !== undefined;

    const [files] = useFilesStore((s) => [s.files]);
    const [project, tabIndex, setTabIndex] = useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex]);
    const [setFile, file] = useFileStore((s) => [s.setFile, s.file]);
    const [integration] = useIntegrationStore((s) => [s.integration], shallow)

    const [buildContainerId, setBuildContainerId] = useState<string>('');
    const [hasDevMode, setHasDevMode] = useState<boolean>(false);

    useEffect(() => {
        selectName();
    }, [tabIndex, hasDevmodeContainers, hasBuildContainers, buildContainer?.containerId, buildContainerId, packagedIsRunning])

    function selectName() {
        const selectedContainers = containerStatuses?.filter(c => c.containerName === selectedContainerName) || [];
        const names = containerStatuses
            ?.filter(cs => {
                if (tabIndex === "build") {
                    return cs.type === 'build'
                } else {
                    return ['devmode', 'packaged'].includes(cs.type)
                }
            })
            ?.map(cs => cs.containerName);
        const name = names?.at(0);
        if (tabIndex === "build" && buildContainer?.containerId && buildContainerId !== buildContainer?.containerId) {
            setSelectedContainerName(undefined);
            setBuildContainerId(buildContainer?.containerId);
        } else if (tabIndex === "build" && buildContainerId === buildContainer?.containerId && selectedContainerName === undefined) {
            setSelectedContainerName(buildContainer.containerName);
        } else if (!hasDevmodeContainers && hasDevMode) {
            setHasDevMode(false);
            if (ProjectRuntimeMenus.includes(tabIndex as ProjectRuntimeMenu)) {
                setTabIndex('topology');
            }
            setSelectedContainerName(undefined);
        } else if (hasDevmodeContainers && !hasDevMode) {
            setHasDevMode(true);
            setSelectedContainerName(devModeContainerStatus?.containerName);
        } else if (selectedContainers.length === 0 && selectedContainerName !== undefined) {
            setSelectedContainerName(undefined);
        } else if (selectedContainerName === undefined || !names?.includes(selectedContainerName) && name) {
            setSelectedContainerName(name);
        } else if (!names?.includes(selectedContainerName)) {
            setSelectedContainerName(undefined);
        }
    }

    function isBuildIn(): boolean {
        return BUILD_IN_PROJECTS.includes(project?.projectId);
    }

    const onNavSelect = (e: React.MouseEvent<HTMLElement, MouseEvent>, tabIndex: string | number) => {
        setTabIndex(tabIndex as ProjectMenu);
        setFile('none', undefined);
    };

    function getProjectMenu(): ProjectMenu[] {
        const menu: ProjectMenu[] = []
        if (isBuildIn()) {
            menu.push('source');
        } else {
            menu.push(...ProjectMenus);
        }
        return menu;
    }

    function getProjectRuntimeMenusMenu(): ProjectRuntimeMenu[] {
        const menu: (ProjectRuntimeMenu)[] = []
        if ((devModeIsRunning || packagedIsRunning || devModeContainerStatus) && tabIndex !== "build") {
            menu.push(...ProjectRuntimeMenus);
        }
        return menu;
    }

    const menus = [...getProjectMenu(), ...getProjectRuntimeMenusMenu()]
    return (
        <Tabs onSelect={onNavSelect} isNav className="project-page-navigation" activeKey={tabIndex}>
            {menus?.map(item => {
                const title = <TabTitleText>{capitalize(item)}</TabTitleText>
                return (
                    <Fragment key={item}>
                        {item === 'log' && <Divider key={item+"-divider"} orientation={{default: 'vertical'}}/>}
                        <Tab key={item} eventKey={item} title={title}/>
                    </Fragment>
                )
            })}
        </Tabs>
    )
}
