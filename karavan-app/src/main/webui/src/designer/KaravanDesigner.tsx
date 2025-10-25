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
import './KaravanDesigner.css';
import {RouteDesigner} from "./route/RouteDesigner";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelUi} from "./utils/CamelUi";
import {useDesignerStore, useIntegrationStore} from "./DesignerStore";
import {shallow} from "zustand/shallow";
import {InfrastructureAPI} from "./utils/InfrastructureAPI";
import {EventBus, IntegrationUpdate} from "./utils/EventBus";
import {RestDesigner} from "./rest/RestDesigner";
import {BeansDesigner} from "./beans/BeansDesigner";
import {KameletDesigner} from "./kamelet/KameletDesigner";
import {BeanFactoryDefinition, RouteDefinition, RouteTemplateDefinition} from "karavan-core/lib/model/CamelDefinition";
import {ErrorBoundaryState, ErrorBoundaryWrapper} from "./ErrorBoundaryWrapper";
import {Panel, PanelGroup, PanelResizeHandle} from 'react-resizable-panels';
import {MainPropertiesPanel} from "./property/MainPropertiesPanel";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {KaravanDesignerViewSwitch} from "@/designer/KaravanDesignerViewSwitch";

interface Props {
    onSave: (filename: string, yaml: string, propertyOnly: boolean) => void
    onSaveCustomCode: (name: string, code: string, active: boolean) => void
    onGetCustomCode: (name: string, javaType: string) => Promise<string | undefined>
    onSavePropertyPlaceholder: (key: string, value: string) => void
    onInternalConsumerClick: (uri?: string, name?: string, routeId?: string, fileName?: string) => void
    onCreateNewRoute: (componentName: string, propertyName: string, propertyValue: string) => void
    onCreateNewFile: (fileName: string, code: string, open: boolean) => void
    filename: string
    yaml: string
    showCodeTab: boolean
    tab?: "routes" | "rest" | "beans" | "kamelet"
    propertyPlaceholders: [string, string][]
    beans: BeanFactoryDefinition[]
    files: IntegrationFile[]
    mainRightPanel?: React.ReactNode
}

export function KaravanDesigner(props: Props) {

    const [setSelectedStep, reset, badge, message, setPropertyPlaceholders, setBeans, tab, setTab, selectedStep, setSelectedUuids, setDesignerSwitch] =
        useDesignerStore((s) =>
            [s.setSelectedStep, s.reset, s.notificationBadge, s.notificationMessage, s.setPropertyPlaceholders, s.setBeans, s.tab, s.setTab,
                s.selectedStep, s.setSelectedUuids, s.setDesignerSwitch], shallow)
    const [integration, setIntegration, resetFiles] = useIntegrationStore((s) =>
        [s.integration, s.setIntegration, s.resetFiles], shallow)

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
            InfrastructureAPI.setOnCreateNewRoute(props.onCreateNewRoute);
            InfrastructureAPI.setOnCreateNewFile(props.onCreateNewFile);

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
            setPropertyPlaceholders(props.propertyPlaceholders)
            setBeans(props.beans)
            resetFiles(props.files)
            resolveSelectedStep(i);
        } catch (e: any) {
            console.error(e)
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

    function resolveSelectedStep(i: Integration) {
        try {
            if (selectedStep) {
                const step = CamelDefinitionApiExt.findElementById(i, (selectedStep as any).id)
                if (step) {
                    setSelectedStep(step);
                    setSelectedUuids([step?.uuid])
                }
            } else {
                const r = CamelDefinitionApiExt.getFlowsOfTypes(integration, ['RouteDefinition', 'RouteTemplateDefinition'])?.at(0);
                if (r) {
                    const step = r?.dslName === 'RouteDefinition' ? (r as RouteDefinition).from : (r as RouteTemplateDefinition).route?.from;
                    if (step) {
                        setSelectedStep(step);
                        setSelectedUuids([step?.uuid])
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }

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

    const [state, setState] = useState<ErrorBoundaryState>({hasError: false, error: null});

    const resetErrorBoundary = () => {
        setState({hasError: false, error: null});
    };

    // Mimic `getDerivedStateFromError`
    const handleError = (error: Error) => {
        setState({hasError: true, error});
        setDesignerSwitch(false)
    }

    useEffect(() => {
        if (state.hasError && state.error) {
            EventBus.sendAlert(state.error.message, state.error?.stack?.toString()?.substring(0, 300) || '', 'danger');
        }
    }, [state]);

    function getMainPart() {
        return (
            <div className="karavan-designer-page">
                <KaravanDesignerViewSwitch/>
                <ErrorBoundaryWrapper onError={handleError}>
                    {tab === 'kamelet' && <KameletDesigner/>}
                    {tab === 'routes' && <RouteDesigner/>}
                    {tab === 'rest' && <RestDesigner/>}
                    {tab === 'beans' && <BeansDesigner/>}
                </ErrorBoundaryWrapper>
            </div>
        )
    }

    return (
        (tab !== 'kamelet')
            ? <PanelGroup direction="horizontal">
                <Panel minSize={10} defaultSize={70}>
                    {getMainPart()}
                </Panel>
                <PanelResizeHandle className='resize-handler'/>
                <Panel minSize={10} defaultSize={30}>
                    {props.mainRightPanel || <MainPropertiesPanel/>}
                </Panel>
            </PanelGroup>
            : <PanelGroup direction="horizontal">
                {getMainPart()}
            </PanelGroup>
    )
}