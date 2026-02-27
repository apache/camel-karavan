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
import {Badge, capitalize, Content, Flex, FlexItem, Nav, NavItem, NavList, Switch, TextInput} from "@patternfly/react-core";
import {KameletsTab} from "./kamelets/KameletsTab";
import {EipTab} from "./eip/EipTab";
import {ComponentsTab} from "./components/ComponentsTab";
import {KameletApi} from "@karavan-core/api/KameletApi";
import {KameletModel} from "@karavan-core/model/KameletModels";
import {ComponentApi} from "@karavan-core/api/ComponentApi";
import {CamelModelMetadata, ElementMeta} from "@karavan-core/model/CamelMetadata";
import {RightPanel} from "@shared/ui/RightPanel";
import './Documentation.css'
import {ProjectService} from "@services/ProjectService";
import {ProjectType} from "@models/ProjectModels";
import {useFilesStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {extractTitleFromMarkdown} from "@util/StringUtils";
import MarkdownPreview from "@uiw/react-markdown-preview";
import {ErrorBoundaryWrapper} from "@shared/ui/ErrorBoundaryWrapper";
import {useTheme} from "@app/theme/ThemeContext";
import {SourcesTab} from "@features/project/files/SourcesTab";

const BUILD_IN_DOCUMENTATION_PAGES = ['processors', 'components', 'kamelets', 'source']

export const DocumentationPage = () => {

    const {isDark} = useTheme();
    const [files] = useFilesStore((s) => [s.files], shallow);
    const [pages, setPages] = useState<string[]>(BUILD_IN_DOCUMENTATION_PAGES);
    const [pageNames, setPageNames] = useState<string[]>(BUILD_IN_DOCUMENTATION_PAGES.map(item => capitalize(item)));
    const [filter, setFilter] = useState<string>("");
    const [markdown, setMarkdown] = useState<string>("");
    const [customOnly, setCustomOnly] = useState<boolean>(false);
    const [activeItem, setActiveItem] = useState<string>();

    const onSelect = (_event: React.FormEvent<HTMLInputElement>, result: { itemId: number | string }) => {
        const item = result.itemId?.toString();
        setActiveItem(item);
    }

    useEffect(() => {
        ProjectService.refreshProjectFiles(ProjectType.documentation)
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
        setActiveItem(newPages[0])
    }, [files]);

    let kameletList: KameletModel[] = KameletApi.getAllKamelets().filter(kamelet =>
        kamelet.spec.definition.title.toLowerCase().includes(filter.toLowerCase()));
    if (customOnly) kameletList = kameletList.filter(k => KameletApi.getCustomKameletNames().includes(k.metadata.name));

    const components = ComponentApi.getComponents().filter(c => {
        return c.component?.name?.toLowerCase().includes(filter.toLowerCase())
            || c.component?.title?.toLowerCase().includes(filter.toLowerCase())
            || c.component?.description?.toLowerCase().includes(filter.toLowerCase())
    }).sort((a, b) => (a.component.title?.toLowerCase() > b.component.title?.toLowerCase() ? 1 : -1));

    const elements = CamelModelMetadata
        .filter(c => c.name.toLowerCase().includes(filter.toLowerCase())).sort((a: ElementMeta, b: ElementMeta) => a.name > b.name ? 1 : -1);

    function activeItemIsBuildIn() {
        return activeItem && BUILD_IN_DOCUMENTATION_PAGES.includes(activeItem);
    }
    function getNavigation() {
        const lengths: any = {
            'processors': elements.length,
            'components': components.length,
            'kamelets': kameletList.length,
        }
        return (
            <Nav onSelect={onSelect} aria-label="Nav" variant="horizontal" className='documentation-navigation'>
                <NavList>
                    {pages.map((item, i) => {
                        const showBadge = BUILD_IN_DOCUMENTATION_PAGES.includes(item);
                        return (
                            <NavItem key={item} preventDefault itemId={item} isActive={activeItem === item} to="#">
                                <div style={{cursor: 'pointer'}}>
                                    {pageNames[i]}
                                    {showBadge && <Badge className={`nav-label label-${item.substring(0, item.length - 1)}`}>{lengths[item]}</Badge>}
                                </div>
                            </NavItem>
                        )
                    })}
                </NavList>
            </Nav>
        )
    }

    function title() {
        return <Content>
            <Content component="h2">Documentation</Content>
        </Content>
    }

    function getTools() {
        return <div>
            <Flex>
                {activeItem === 'kamelets' && <FlexItem>
                    <Switch
                        label="Custom only"
                        isChecked={customOnly}
                        onChange={(_event, checked) => setCustomOnly(checked)}
                    />
                </FlexItem>}
                <FlexItem>
                    <TextInput className="text-field" type="search" id="search" name="search"
                               value={filter}
                               onChange={(_event, value) => setFilter(value)}
                               autoComplete="off"
                               placeholder="Search by name"/>
                </FlexItem>
            </Flex>
        </div>
    }

    return (
        <RightPanel
            title={title()}
            toolsStart={getNavigation()}
            tools={activeItemIsBuildIn() ? getTools() : undefined}
            mainPanel={
                <div className="right-panel-card">
                    <div className="documentation-section">
                        {activeItem === 'kamelets' && <KameletsTab kameletList={kameletList}/>}
                        {activeItem === 'processors' && <EipTab elements={elements}/>}
                        {activeItem === 'components' && <ComponentsTab components={components}/>}
                        {activeItem === 'source' && <SourcesTab />}
                        {!activeItemIsBuildIn() &&
                            <ErrorBoundaryWrapper onError={error => console.error((error))}>
                                <MarkdownPreview key={"DocumentationMarkdownPreview"} source={markdown} wrapperElement={{'data-color-mode': isDark ? 'dark' : 'light'}}/>
                            </ErrorBoundaryWrapper>
                        }
                    </div>
                </div>
            }
        />
    )

}