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
import {
    Badge,
    Button,
    PageSection,
    PageSectionVariants,
    Tab,
    Tabs,
    TabTitleIcon,
    TabTitleText,
} from '@patternfly/react-core';
import './karavan.css';
import {RouteDesigner} from "./route/RouteDesigner";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelUi} from "./utils/CamelUi";
import {useDesignerStore, useIntegrationStore} from "./DesignerStore";
import {shallow} from "zustand/shallow";
import {getDesignerIcon} from "./icons/KaravanIcons";
import {InfrastructureAPI} from "./utils/InfrastructureAPI";
import {EventBus, IntegrationUpdate} from "./utils/EventBus";
import {RestDesigner} from "./rest/RestDesigner";
import {BeansDesigner} from "./beans/BeansDesigner";
import {CodeEditor} from "./editor/CodeEditor";
import BellIcon from '@patternfly/react-icons/dist/esm/icons/bell-icon';
import {KameletDesigner} from "./kamelet/KameletDesigner";
import {BeanFactoryDefinition} from "karavan-core/lib/model/CamelDefinition";
import {VariableUtil} from "karavan-core/lib/api/VariableUtil";
import {ErrorBoundaryState, ErrorBoundaryWrapper} from "./ErrorBoundaryWrapper";
import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';
import {MainPropertiesPanel} from "./property/MainPropertiesPanel";

interface Props {
    onSave: (filename: string, yaml: string, propertyOnly: boolean) => void
    onSaveCustomCode: (name: string, code: string) => void
    onGetCustomCode: (name: string, javaType: string) => Promise<string | undefined>
    onSavePropertyPlaceholder: (key: string, value: string) => void
    onInternalConsumerClick: (uri?: string, name?: string, routeId?: string) => void
    filename: string
    yaml: string
    dark: boolean
    showCodeTab: boolean
    tab?: "routes" | "rest" | "beans" | "kamelet"
    propertyPlaceholders: string[]
    beans: BeanFactoryDefinition[]
    files: IntegrationFile[]
    mainRightPanel?: React.ReactNode
}

export function KaravanDesigner(props: Props) {

    const [setDark, setSelectedStep, reset, badge, message, setPropertyPlaceholders, setBeans, tab, setTab] =
        useDesignerStore((s) =>
            [s.setDark, s.setSelectedStep, s.reset, s.notificationBadge, s.notificationMessage, s.setPropertyPlaceholders, s.setBeans, s.tab, s.setTab], shallow)
    const [integration, setIntegration, resetFiles, setVariables] = useIntegrationStore((s) =>
        [s.integration, s.setIntegration, s.resetFiles, s.setVariables], shallow)

    useEffect(() => {
        const sub = EventBus.onIntegrationUpdate()?.subscribe((update: IntegrationUpdate) =>
            save(update.integration, update.propertyOnly));
        try {
            resetErrorBoundary();
            InfrastructureAPI.setOnSaveCustomCode(props.onSaveCustomCode);
            InfrastructureAPI.setOnGetCustomCode(props.onGetCustomCode);
            InfrastructureAPI.setOnSave(props.onSave);
            InfrastructureAPI.setOnSavePropertyPlaceholder(props.onSavePropertyPlaceholder);
            InfrastructureAPI.setOnInternalConsumerClick(props.onInternalConsumerClick);

            setSelectedStep(undefined);
            const i = makeIntegration(props.yaml, props.filename);
            setIntegration(i, false);
            let designerTab = i.kind === 'Kamelet' ? 'kamelet' : props.tab;
            if (designerTab === undefined) {
                const counts = CamelUi.getFlowCounts(i);
                designerTab = (counts.get('routes') || 0) > 0 ? 'routes' : designerTab;
                designerTab = (counts.get('rest') || 0) > 0 ? 'rest' : designerTab;
                designerTab = (counts.get('beans') || 0) > 0 ? 'beans' : designerTab;
            }
            setTab(designerTab || 'routes')
            reset();
            setDark(props.dark);
            setPropertyPlaceholders(props.propertyPlaceholders)
            setVariables(VariableUtil.findVariables(props.files))
            setBeans(props.beans)
            resetFiles(props.files)
        } catch (e: any) {
            console.log(e)
            EventBus.sendAlert(' ' + e?.name, '' + e?.message, 'danger');
        }
        return () => {
            sub?.unsubscribe();
            setSelectedStep(undefined);
            reset();
            resetErrorBoundary();
            setIntegration(Integration.createNew("demo"), false);
        };
    }, []);

    function makeIntegration(yaml: string, filename: string): Integration {
        try {
            const type = CamelDefinitionYaml.yamlIsIntegration(yaml);
            if (yaml && type !== 'none') {
                const i = CamelDefinitionYaml.yamlToIntegration(props.filename, props.yaml)
                return i;
            } else {
                return Integration.createNew(filename, 'plain');
            }
        } catch (e) {
            console.error(e)
            EventBus.sendAlert("Error parsing YAML", (e as Error).message, 'danger')
            return Integration.createNew(filename, 'plain');
        }
    }

    function save(integration: Integration, propertyOnly: boolean): void {
        const code = getCode(integration);
        props.onSave(props.filename, code, propertyOnly);
    }

    function getCode(integration: Integration): string {
        try {
            const clone = CamelUtil.cloneIntegration(integration);
            return CamelDefinitionYaml.integrationToYaml(clone);
        } catch (e) {
            console.error(e)
            EventBus.sendAlert('Error parsing Yaml', (e as Error).message, 'danger');
            return '';
        }
    }

    function getTab(title: string, tooltip: string, icon: string, showBadge: boolean = false) {
        const counts = CamelUi.getFlowCounts(integration);
        const count = counts.has(icon) && counts.get(icon) ? counts.get(icon) : undefined;
        const showCount = count && count > 0;
        const color = showBadge && badge ? "red" : "initial";
        return (
            <div className="top-menu-item" style={{color: color}}>
                <TabTitleIcon>{getDesignerIcon(icon)}</TabTitleIcon>
                <TabTitleText>{title}</TabTitleText>
                {showCount && <Badge isRead className="count">{counts.get(icon)}</Badge>}
                {showBadge && badge &&
                    <Button variant="link"
                            icon={<BellIcon color="red"/>}
                            style={{visibility: (badge ? 'visible' : 'hidden'), padding: '0', margin: '0'}}
                            onClick={event => EventBus.sendAlert(message[0], message[1], 'danger')}/>
                }
            </div>
        )
    }

    const isKamelet = integration.type === 'kamelet';

    const [state, setState] = useState<ErrorBoundaryState>({ hasError: false, error: null });

    const resetErrorBoundary = () => {
        setState({ hasError: false, error: null });
    };

    // Mimic `getDerivedStateFromError`
    const handleError = (error: Error) => {
        setState({ hasError: true, error });
        setTab('code')
        console.log(props.filename, error)
    }

    useEffect(() => {
        if (state.hasError && state.error) {
            EventBus.sendAlert(state.error.message, state.error?.stack?.toString()?.substring(0, 300) || '', 'danger');
        }
    }, [state]);

    function getMainPart() {
        return (
            <PageSection variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light} className="page" isFilled padding={{default: 'noPadding'}}>
                <div className={"main-tabs-wrapper"}>
                    <Tabs className="main-tabs"
                          activeKey={tab}
                          onSelect={(event, tabIndex: string | number) => {
                              const tab = tabIndex.toString() as "routes" | "rest" | "beans" | "kamelet" | "code";
                              if (["routes", "rest", "beans", "kamelet", "code"].includes(tab)) {
                                  setTab(tab);
                              } else {
                                  setTab(undefined); // Handle unexpected values
                              }
                              setSelectedStep(undefined);
                          }}
                          style={{width: "100%"}}>
                        {isKamelet && <Tab eventKey='kamelet' title={getTab("Definitions", "Kamelet Definitions", "kamelet")}></Tab>}
                        <Tab eventKey='routes' title={getTab("Routes", "Integration flows", "routes")}></Tab>
                        {!isKamelet && <Tab eventKey='rest' title={getTab("REST", "REST services", "rest")}></Tab>}
                        <Tab eventKey='beans' title={getTab("Beans", "Beans Configuration", "beans")}></Tab>
                        {props.showCodeTab && <Tab eventKey='code' title={getTab("YAML", "YAML Code", "code", true)}></Tab>}
                    </Tabs>
                </div>
                <ErrorBoundaryWrapper onError={handleError}>
                    {tab === 'kamelet' && <KameletDesigner/>}
                    {tab === 'routes' && <RouteDesigner/>}
                    {tab === 'rest' && <RestDesigner/>}
                    {tab === 'beans' && <BeansDesigner/>}
                    {tab === 'code' && <CodeEditor/>}
                </ErrorBoundaryWrapper>
            </PageSection>
        )
    }

    return (
        (tab !== 'code' && tab !== 'kamelet')
        ? <PanelGroup direction="horizontal" style={{backgroundColor: 'white'}}>
            <Panel minSize={10} defaultSize={70}>
                {getMainPart()}
            </Panel>
            <PanelResizeHandle className='resize-handler'/>
            <Panel minSize={10} defaultSize={30}>
                {props.mainRightPanel || <MainPropertiesPanel/>}
            </Panel>
        </PanelGroup>
        : <PanelGroup direction="horizontal" style={{backgroundColor: 'white'}}>
                {getMainPart()}
            </PanelGroup>
    )
}