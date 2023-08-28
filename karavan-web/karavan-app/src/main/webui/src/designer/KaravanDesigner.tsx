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
    PageSection,
    PageSectionVariants,
    Switch,
    Tab,
    Tabs,
    TabTitleIcon, TabTitleText,
    Tooltip,
} from '@patternfly/react-core';
import './karavan.css';
import {RouteDesigner} from "./route/RouteDesigner";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelUi} from "./utils/CamelUi";
import {useDesignerStore, useIntegrationStore} from "./KaravanStore";
import {shallow} from "zustand/shallow";
import {getDesignerIcon} from "./utils/KaravanIcons";
import {InfrastructureAPI} from "./utils/InfrastructureAPI";
import {EventBus, IntegrationUpdate} from "./utils/EventBus";
import {RestDesigner} from "./rest/RestDesigner";
import {BeansDesigner} from "./beans/BeansDesigner";

interface Props {
    onSave: (filename: string, yaml: string, propertyOnly: boolean) => void
    onSaveCustomCode: (name: string, code: string) => void
    onGetCustomCode: (name: string, javaType: string) => Promise<string | undefined>
    filename: string
    yaml: string
    dark: boolean
    hideLogDSL?: boolean
    tab?: string
}

export function KaravanDesigner (props: Props) {

    const [tab, setTab] = useState<string>('routes');
    const [setDark, hideLogDSL, setHideLogDSL, setSelectedStep, reset] = useDesignerStore((s) =>
        [s.setDark, s.hideLogDSL, s.setHideLogDSL, s.setSelectedStep, s.reset], shallow)
    const [integration, setIntegration] = useIntegrationStore((s) =>
        [s.integration, s.setIntegration], shallow)

    useEffect(() => {
        const sub = EventBus.onIntegrationUpdate()?.subscribe((update: IntegrationUpdate) =>
            save(update.integration, update.propertyOnly));
        InfrastructureAPI.setOnSaveCustomCode(props.onSaveCustomCode);
        InfrastructureAPI.setOnGetCustomCode(props.onGetCustomCode);
        InfrastructureAPI.setOnSave(props.onSave);

        setSelectedStep(undefined);
        setIntegration(makeIntegration(props.yaml, props.filename), false);
        reset();
        setDark(props.dark);
        setHideLogDSL(props.hideLogDSL === true);
        return () => {
            sub?.unsubscribe();
            setSelectedStep(undefined);
            reset();
        };
    }, []);

    function makeIntegration(yaml: string, filename: string): Integration {
        if (yaml && CamelDefinitionYaml.yamlIsIntegration(yaml)) {
            return CamelDefinitionYaml.yamlToIntegration(props.filename, props.yaml)
        } else {
            return Integration.createNew(filename, 'plain');
        }
    }

    function save(integration: Integration, propertyOnly: boolean): void {
        const code = getCode(integration);
        props.onSave(props.filename, code, propertyOnly);
    }

    function getCode(integration: Integration): string {
        const clone = CamelUtil.cloneIntegration(integration);
        return CamelDefinitionYaml.integrationToYaml(clone);
    }

    function getTab(title: string, tooltip: string, icon: string) {
        const counts = CamelUi.getFlowCounts(integration);
        const count = counts.has(icon) && counts.get(icon) ? counts.get(icon) : undefined;
        const showCount = count && count > 0;
        return (
            <Tooltip position={"bottom"}
                     content={<div>{tooltip}</div>}>
                <div className="top-menu-item">
                    <TabTitleIcon>{getDesignerIcon(icon)}</TabTitleIcon>
                    <TabTitleText>{title}</TabTitleText>
                    {showCount && <Badge isRead className="count">{counts.get(icon)}</Badge>}
                </div>
            </Tooltip>

        )
    }

    return (
        <PageSection variant={props.dark ? PageSectionVariants.darker : PageSectionVariants.light} className="page"
                     isFilled padding={{default: 'noPadding'}}>
            <div className={"main-tabs-wrapper"}>
                <Tabs className="main-tabs"
                      activeKey={tab}
                      onSelect={(event, tabIndex) => {
                          setTab(tabIndex.toString());
                          setSelectedStep(undefined);
                      }}
                      style={{width: "100%"}}>
                    <Tab eventKey='routes' title={getTab("Routes", "Integration flows", "routes")}></Tab>
                    <Tab eventKey='rest' title={getTab("REST", "REST services", "rest")}></Tab>
                    <Tab eventKey='beans' title={getTab("Beans", "Beans Configuration", "beans")}></Tab>
                </Tabs>
                {tab === 'routes' && <Tooltip content={"Hide Log elements"}>
                    <Switch
                        isReversed
                        isChecked={hideLogDSL}
                        onChange={(_, checked) => {
                            setHideLogDSL(checked)
                        }}
                        id="hideLogDSL"
                        name="hideLogDSL"
                        className={"hide-log"}
                    />
                </Tooltip>}
            </div>
            {tab === 'routes' && <RouteDesigner/>}
            {tab === 'rest' && <RestDesigner/>}
            {tab === 'beans' && <BeansDesigner/>}
        </PageSection>
    )
}