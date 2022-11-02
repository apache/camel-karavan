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
    Badge,
    PageSection, PageSectionVariants, Tab, Tabs, TabTitleIcon, TabTitleText, Tooltip,
} from '@patternfly/react-core';
import './karavan.css';
import {RouteDesigner} from "./route/RouteDesigner";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelUi} from "./utils/CamelUi";
import {BeansDesigner} from "./beans/BeansDesigner";
import {RestDesigner} from "./rest/RestDesigner";
import {ErrorDesigner} from "./error/ErrorDesigner";
import {ExceptionDesigner} from "./exception/ExceptionDesigner";
import {getDesignerIcon} from "./utils/KaravanIcons";

interface Props {
    onSave?: (filename: string, yaml: string, propertyOnly: boolean) => void
    onDisableHelp?: () => void
    filename: string
    yaml: string
    dark: boolean
    tab?: string
}

interface State {
    tab: string
    integration: Integration
    key: string
    propertyOnly: boolean
    routeDesignerRef?: any
}

export class KaravanDesigner extends React.Component<Props, State> {

    public state: State = {
        tab: this.props.tab ? this.props.tab : 'routes',
        integration: this.props.yaml && CamelDefinitionYaml.yamlIsIntegration(this.props.yaml)
            ? CamelDefinitionYaml.yamlToIntegration(this.props.filename, this.props.yaml)
            : Integration.createNew(this.props.filename),
        key: "",
        propertyOnly: false,
        routeDesignerRef: React.createRef(),
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.props.filename, this.getCode(this.state.integration), this.state.propertyOnly);
        }
    }

    save = (integration: Integration, propertyOnly: boolean): void => {
        this.setState({key: Math.random().toString(), integration: integration, propertyOnly: propertyOnly});
    }

    getCode = (integration: Integration): string => {
        const clone = CamelUtil.cloneIntegration(integration);
        return CamelDefinitionYaml.integrationToYaml(clone);
    }

    getTab(title: string, tooltip: string, icon: string) {
        const counts = CamelUi.getFlowCounts(this.state.integration);
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

    downloadImage(){
        if(this.state.routeDesignerRef){
            this.state.routeDesignerRef.current.IntegrationImageDownload();
         }
    }

    render() {
        const tab = this.state.tab;
        return (
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} className="page" isFilled padding={{default: 'noPadding'}}>
                <Tabs className="main-tabs" activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex.toString()})} style={{width: "100%"}}>
                    <Tab eventKey='routes' title={this.getTab("Routes", "Integration flows", "routes")}></Tab>
                    <Tab eventKey='rest' title={this.getTab("REST", "REST services", "rest")}></Tab>
                    <Tab eventKey='beans' title={this.getTab("Beans", "Beans Configuration", "beans")}></Tab>
                    <Tab eventKey='error' title={this.getTab("Error", "Error Handler", "error")}></Tab>
                    <Tab eventKey='exception' title={this.getTab("Exceptions", "Exception Clauses per type", "exception")}></Tab>
                </Tabs>
                {tab === 'routes' && <RouteDesigner integration={this.state.integration}
                                                    onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                    dark={this.props.dark} ref={this.state.routeDesignerRef}/>}
                {tab === 'rest' && <RestDesigner integration={this.state.integration}
                                                 onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                 dark={this.props.dark}/>}
                {tab === 'beans' && <BeansDesigner integration={this.state.integration}
                                                   onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                   dark={this.props.dark}/>}
                {tab === 'error' && <ErrorDesigner integration={this.state.integration}
                                                   onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                   dark={this.props.dark}/>}
                {tab === 'exception' && <ExceptionDesigner integration={this.state.integration}
                                                           onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                           dark={this.props.dark}/>}
            </PageSection>
        )
    }
}