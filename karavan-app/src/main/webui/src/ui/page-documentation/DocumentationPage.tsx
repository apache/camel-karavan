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
import React, {useEffect, useState} from 'react';
import {Badge, capitalize, Content, Label, Switch, Tab, Tabs, TabTitleText, TextInput} from "@patternfly/react-core";
import {EipTab} from "./eip/EipTab";
import {ComponentsTab} from "./components/ComponentsTab";
import {ComponentApi} from "@core/api/ComponentApi";
import {CamelModelMetadata, ElementMeta} from "@core/model/CamelMetadata";
import {RightPanel} from "@shared/ui/RightPanel";
import './Documentation.css'
import {ProjectService} from "@services/ProjectService";
import {Project, ProjectType} from "@models/ProjectModels";
import {useFilesStore, useFileStore, useProjectStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {extractTitleFromMarkdown} from "@utils/StringUtils";
import MarkdownPreview from "@uiw/react-markdown-preview";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {useTheme} from "@compass/theme/ThemeContext";
import {SourcesTab} from "@page-project/files/SourcesTab";
import {DeveloperManager} from "@developer/DeveloperManager";
import {SourcesDrawerPanel} from "@page-project/files/SourcesDrawerPanel";
import {TabProps} from "@patternfly/react-core/src/components/Tabs/Tab";
import {useDocumentationHook} from "./useDocumentationHook";
import {useDocumentationStore} from "@stores/DocumentationStore";
import {CAMEL_STEP_ELEMENTS} from "@designer/utils/CamelUi";

const BUILD_IN_DOCUMENTATION_PAGES = ['processors', 'components', 'source']

export const DocumentationPage = () => {

    const {isDark} = useTheme();
    const {loadData} = useDocumentationHook();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [showBlocked, setShowBlocked] = useDocumentationStore((s) => [s.showBlocked, s.setShowBlocked], shallow);
    const [setProject] = useProjectStore((s) => [s.setProject], shallow);
    const [file, operation, setFile] = useFileStore((s) => [s.file, s.operation, s.setFile], shallow);
    const showFilePanel = file !== undefined && operation === 'select';
    const [pages, setPages] = useState<string[]>(BUILD_IN_DOCUMENTATION_PAGES);
    const [pageNames, setPageNames] = useState<string[]>(BUILD_IN_DOCUMENTATION_PAGES.map(item => capitalize(item)));
    const [filter, setFilter] = useState<string>("");
    const [markdown, setMarkdown] = useState<string>("");
    const [activeItem, setActiveItem] = useState<string>();

    const onNavSelect = (event: React.MouseEvent<HTMLElement, MouseEvent>, eventKey: TabProps['eventKey']) => {
        setFile('none', undefined);
        setActiveItem(eventKey?.toString());
    }

    useEffect(() => {
        setProject(new Project({projectId: ProjectType.documentation, name: ProjectType.documentation, type: ProjectType.documentation}), "none");
        ProjectService.refreshProjectFiles(ProjectType.documentation);
        loadData();
        return () => {
            setProject(new Project(), "none");
        }
    }, []);

    useEffect(() => {
        if (!activeItemIsBuildIn()) {
            const m = files.filter(f => f.name === activeItem)?.[0]?.code || '';
            setMarkdown(m)
        }
    }, [activeItem]);

    useEffect(() => {
        const newPages: string[] = [];
        const newPageNames: string[] = [];
        files.filter(file => file.name.endsWith(".md")).sort((a, b) => a.name > b.name ? 1 : -1).forEach(file => {
            newPages.push(file.name);
            newPageNames.push(extractTitleFromMarkdown(file.code) || file.name);
        });
        newPages.push(...BUILD_IN_DOCUMENTATION_PAGES);
        newPageNames.push(...BUILD_IN_DOCUMENTATION_PAGES.map(item => capitalize(item)));
        setPages(newPages);
        setPageNames(newPageNames);
        if (activeItem === undefined) {
            setActiveItem(newPages[0])
        }
    }, [files]);

    const allComponents = ComponentApi.getComponents();
    const availableComponents = allComponents?.filter(c => !ComponentApi.getBlockedComponentNames().includes(c.component.name));
    const components = allComponents
        .filter(c => {
            return showBlocked || !ComponentApi.getBlockedComponentNames().includes(c.component.name)
        })
        .filter(c => {
            return c.component?.name?.toLowerCase().includes(filter.toLowerCase())
                || c.component?.title?.toLowerCase().includes(filter.toLowerCase())
                || c.component?.description?.toLowerCase().includes(filter.toLowerCase())
        }).sort((a, b) => (a.component.title?.toLowerCase() > b.component.title?.toLowerCase() ? 1 : -1));
    const allComponentsQuantity = allComponents?.length;
    const availableComponentsQuantity = availableComponents?.length;

    const processors = CamelModelMetadata
        .filter(c => CAMEL_STEP_ELEMENTS.includes(c.className))
        .filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).sort((a: ElementMeta, b: ElementMeta) => a.name > b.name ? 1 : -1);

    const processorsQuantity = processors?.length;

    function activeItemIsBuildIn() {
        return activeItem && BUILD_IN_DOCUMENTATION_PAGES.includes(activeItem);
    }

    function getNavigation() {
        return (
            <Tabs onSelect={onNavSelect} isNav activeKey={activeItem}>
                {pages.map((item, i) => {
                    return (
                        <Tab
                            key={item}
                            eventKey={item}
                            title={<TabTitleText>{pageNames[i]}</TabTitleText>}
                        />
                    )
                })}
            </Tabs>
        )
    }

    function title() {
        return <Content>
            <Content component="h2">Documentation</Content>
        </Content>
    }

    function getTools() {
        return <div>
            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6}}>
                {activeItem === 'components' &&
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, textWrap: 'nowrap'}}>
                        <Label variant={'outline'}>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, textWrap: 'nowrap'}}>
                                <p>Available</p>
                                <Badge>{availableComponentsQuantity}</Badge>
                                <p>from</p>
                                <Badge isRead>{allComponentsQuantity}</Badge>
                            </div>
                        </Label>
                        <Switch
                            label="Show all"
                            isReversed
                            isChecked={showBlocked}
                            onChange={(_event, checked) => setShowBlocked(checked)}
                        />
                    </div>
                }
                {activeItem === 'processors' &&
                    <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, textWrap: 'nowrap'}}>
                        <Label variant={'outline'}>
                            <div style={{display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6, textWrap: 'nowrap'}}>
                                <p>Available</p>
                                <Badge>{processorsQuantity}</Badge>
                            </div>
                        </Label>
                    </div>
                }
                <TextInput className="text-field" type="search" id="search" name="search"
                           value={filter}
                           onChange={(_event, value) => setFilter(value)}
                           autoComplete="off"
                           placeholder="Search by name"/>
            </div>
        </div>
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={activeItemIsBuildIn() ? getTools() : undefined}
            drawerPanel={<SourcesDrawerPanel/>}
            mainPanel={
                <div className="right-panel-card">
                    <div className="documentation-section">
                        {!showFilePanel && activeItem === 'processors' && <EipTab elements={processors}/>}
                        {!showFilePanel && activeItem === 'components' && <ComponentsTab components={components}/>}
                        {!showFilePanel && activeItem === 'source' && <SourcesTab/>}
                        {showFilePanel && <DeveloperManager/>}
                        {!activeItemIsBuildIn() &&
                            <ErrorBoundaryWrapper onError={error => console.error((error))}>
                                <MarkdownPreview key={"DocumentationMarkdownPreview"}
                                                 source={markdown}
                                                 className="documentation-eip-section"
                                                 wrapperElement={{'data-color-mode': isDark ? 'dark' : 'light'}}
                                />
                            </ErrorBoundaryWrapper>
                        }
                    </div>
                </div>
            }
        />
    )

}