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
    PageSection, Tab, Tabs, TabTitleIcon, TabTitleText, Tooltip,
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
import {TemplatesDesigner} from "./templates/TemplatesDesigner";
import {ExceptionDesigner} from "./exception/ExceptionDesigner";
import {DependenciesDesigner} from "./dependencies/DependenciesDesigner";

interface Props {
    onSave?: (filename: string, yaml: string) => void
    filename: string
    yaml: string
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    tab: string,
    integration: Integration,
    key: string,
}

export class KaravanDesigner extends React.Component<Props, State> {

    public state: State = {
        tab: 'routes',
        integration: this.props.yaml
            ? CamelDefinitionYaml.yamlToIntegration(this.props.filename, this.props.yaml)
            : Integration.createNew(this.props.filename),
        key: "",
    };

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration.metadata.name, this.getCode(this.state.integration));
        }
    }

    save = (integration: Integration): void => {
        this.setState({key: Math.random().toString(), integration: integration});
    }

    getCode = (integration: Integration): string => {
        const clone = CamelUtil.cloneIntegration(integration);
        return CamelDefinitionYaml.integrationToYaml(clone);
    }

    getTab(title: string, tooltip: string, icon: string) {
        const counts = CamelUi.getFlowCounts(this.state.integration);
        return (
            <Tooltip position={"bottom"}
                     content={<div>{tooltip}</div>}>
                <div className="top-menu-item">
                    <TabTitleIcon>{this.getIcon(icon)}</TabTitleIcon>
                    <TabTitleText>{title}</TabTitleText>
                    {counts.has(icon) && <Badge isRead className="count">{counts.get(icon)}</Badge>}
                </div>
            </Tooltip>

        )
    }

    getIcon(icon: string) {
        if (icon === 'routes') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
                <defs>
                    <style>{".cls-1{fill:none;}"}</style>
                </defs>
                <path d="M29,10H24v2h5v6H22v2h3v2.142a4,4,0,1,0,2,0V20h2a2.0027,2.0027,0,0,0,2-2V12A2.0023,2.0023,0,0,0,29,10ZM28,26a2,2,0,1,1-2-2A2.0027,2.0027,0,0,1,28,26Z"/>
                <path d="M19,6H14V8h5v6H12v2h3v6.142a4,4,0,1,0,2,0V16h2a2.0023,2.0023,0,0,0,2-2V8A2.0023,2.0023,0,0,0,19,6ZM18,26a2,2,0,1,1-2-2A2.0027,2.0027,0,0,1,18,26Z"/>
                <path
                    d="M9,2H3A2.002,2.002,0,0,0,1,4v6a2.002,2.002,0,0,0,2,2H5V22.142a4,4,0,1,0,2,0V12H9a2.002,2.002,0,0,0,2-2V4A2.002,2.002,0,0,0,9,2ZM8,26a2,2,0,1,1-2-2A2.0023,2.0023,0,0,1,8,26ZM3,10V4H9l.0015,6Z"/>
                <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" className="cls-1" width="32" height="32"/>
            </svg>)
        if (icon === 'rest') return (
            <svg className="top-icon" viewBox="0 0 32 32">
                <g className="layer">
                    <title>Layer 1</title>
                    <path
                        d="m23.50007,22l-0.5,0l0,-2l0.5,0a4.4975,4.4975 0 0 0 0.3564,-8.981l-0.8154,-0.0639l-0.0986,-0.812a6.9938,6.9938 0 0 0 -13.8838,0l-0.0991,0.812l-0.8155,0.0639a4.4975,4.4975 0 0 0 0.356,8.981l0.5,0l0,2l-0.5,0a6.4973,6.4973 0 0 1 -1.3,-12.8638a8.9943,8.9943 0 0 1 17.6006,0a6.4974,6.4974 0 0 1 -1.3006,12.8638z"
                        id="svg_1"/>
                    <path
                        d="m22.9724,22.26637l0,-2l-2.1011,0a4.9678,4.9678 0 0 0 -0.7319,-1.7529l1.49,-1.49l-1.414,-1.414l-1.49,1.49a4.9678,4.9678 0 0 0 -1.753,-0.732l0,-2.1011l-2,0l0,2.1011a4.9678,4.9678 0 0 0 -1.7529,0.7319l-1.49,-1.49l-1.414,1.414l1.49,1.49a4.9678,4.9678 0 0 0 -0.732,1.753l-2.1011,0l0,2l2.1011,0a4.9678,4.9678 0 0 0 0.7319,1.7529l-1.49,1.49l1.414,1.414l1.49,-1.49a4.9678,4.9678 0 0 0 1.753,0.732l0,2.1011l2,0l0,-2.1011a4.9678,4.9678 0 0 0 1.7529,-0.7319l1.49,1.49l1.414,-1.414l-1.49,-1.49a4.9678,4.9678 0 0 0 0.732,-1.753l2.1011,0zm-7,2a3,3 0 1 1 3,-3a3.0033,3.0033 0 0 1 -3,3z"
                        id="svg_2" transform="rotate(25 15.9724 21.2664)" xmlns="http://www.w3.org/2000/svg"/>
                </g>
            </svg>
        )
        if (icon === 'beans') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
                <defs>
                    <style>{".cls-1 {fill: none;}"}</style>
                </defs>
                <title>data--1</title>
                <rect x="15" y="6" width="13" height="2"/>
                <rect x="15" y="24" width="13" height="2"/>
                <rect x="4" y="15" width="13" height="2"/>
                <path d="M7,11a4,4,0,1,1,4-4A4,4,0,0,1,7,11ZM7,5A2,2,0,1,0,9,7,2,2,0,0,0,7,5Z" transform="translate(0 0)"/>
                <path d="M7,29a4,4,0,1,1,4-4A4,4,0,0,1,7,29Zm0-6a2,2,0,1,0,2,2A2,2,0,0,0,7,23Z" transform="translate(0 0)"/>
                <path d="M25,20a4,4,0,1,1,4-4A4,4,0,0,1,25,20Zm0-6a2,2,0,1,0,2,2A2,2,0,0,0,25,14Z" transform="translate(0 0)"/>
                <g id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;">
                    <rect className="cls-1" width="32" height="32"/>
                </g>
            </svg>
        )
        if (icon === 'dependencies') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
                <defs>
                    <style>{".cls-1 {fill: none;}"}</style>
                </defs>
                <title>application</title>
                <path d="M16,18H6a2,2,0,0,1-2-2V6A2,2,0,0,1,6,4H16a2,2,0,0,1,2,2V16A2,2,0,0,1,16,18ZM6,6V16H16V6Z" transform="translate(0 0)"/>
                <path d="M26,12v4H22V12h4m0-2H22a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h4a2,2,0,0,0,2-2V12a2,2,0,0,0-2-2Z" transform="translate(0 0)"/>
                <path d="M26,22v4H22V22h4m0-2H22a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h4a2,2,0,0,0,2-2V22a2,2,0,0,0-2-2Z" transform="translate(0 0)"/>
                <path d="M16,22v4H12V22h4m0-2H12a2,2,0,0,0-2,2v4a2,2,0,0,0,2,2h4a2,2,0,0,0,2-2V22a2,2,0,0,0-2-2Z" transform="translate(0 0)"/>
                <g id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;">
                    <rect className="cls-1" width="32" height="32"/>
                </g>
            </svg>
        )
        if (icon === 'error') return (
            <svg className="top-icon" width="36px" height="36px" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet">
                <circle className="clr-i-outline clr-i-outline-path-1" cx="18" cy="26.06" r="1.33"/>
                <path className="clr-i-outline clr-i-outline-path-2" d="M18,22.61a1,1,0,0,1-1-1v-12a1,1,0,1,1,2,0v12A1,1,0,0,1,18,22.61Z"/>
                <path className="clr-i-outline clr-i-outline-path-3" d="M18,34A16,16,0,1,1,34,18,16,16,0,0,1,18,34ZM18,4A14,14,0,1,0,32,18,14,14,0,0,0,18,4Z"/>
                <rect x="0" y="0" width="36" height="36" fillOpacity="0"/>
            </svg>)
        if (icon === 'exception') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
                <defs>
                    <style>{".cls-1{fill:none;}"}</style>
                </defs>
                <title>misuse--alt</title>
                <polygon points="21.41 23 16 17.591 10.59 23 9 21.41 14.409 16 9 10.591 10.591 9 16 14.409 21.409 9 23 10.591 17.591 16 23 21.41 21.41 23"/>
                <path d="M16,4A12,12,0,1,1,4,16,12.0136,12.0136,0,0,1,16,4m0-2A14,14,0,1,0,30,16,14,14,0,0,0,16,2Z" transform="translate(0)"/>
                <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" className="cls-1" width="32" height="32"/>
            </svg>)
        if (icon === 'template') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <style>{".cls-1{fill:none;}"}</style>
                </defs>
                <title>code</title>
                <polygon points="31 16 24 23 22.59 21.59 28.17 16 22.59 10.41 24 9 31 16"/>
                <polygon points="1 16 8 9 9.41 10.41 3.83 16 9.41 21.59 8 23 1 16"/>
                <rect x="5.91" y="15" width="20.17" height="2" transform="translate(-3.6 27.31) rotate(-75)"/>
                <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" className="cls-1" width="32" height="32" transform="translate(0 32) rotate(-90)"/>
            </svg>)
    }

    render() {
        const tab = this.state.tab;
        return (
            <PageSection className="page" isFilled padding={{default: 'noPadding'}}>
                <Tabs className="main-tabs" activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex.toString()})} style={{width: "100%"}}>
                    <Tab eventKey='routes' title={this.getTab("Routes", "Integration flows", "routes")}></Tab>
                    <Tab eventKey='rest' title={this.getTab("REST", "REST services", "rest")}></Tab>
                    <Tab eventKey='beans' title={this.getTab("Beans", "Beans Configuration", "beans")}></Tab>
                    <Tab eventKey='dependencies' title={this.getTab("Dependencies", "Dependencies", "dependencies")}></Tab>
                    <Tab eventKey='error' title={this.getTab("Error", "Error Handler configuration", "error")}></Tab>
                    <Tab eventKey='exception' title={this.getTab("Exceptions", "Exception Clauses per type", "exception")}></Tab>
                    <Tab eventKey='templates' title={this.getTab("Templates", "Route Templates", "template")}></Tab>
                </Tabs>
                {tab === 'routes' && <RouteDesigner integration={this.state.integration}
                                                    onSave={(integration) => this.save(integration)}
                                                    borderColor={this.props.borderColor}
                                                    borderColorSelected={this.props.borderColorSelected}
                                                    dark={this.props.dark}/>}
                {tab === 'rest' && <RestDesigner integration={this.state.integration}
                                                 onSave={(integration) => this.save(integration)}
                                                 borderColor={this.props.borderColor}
                                                 borderColorSelected={this.props.borderColorSelected}
                                                 dark={this.props.dark}/>}
                {tab === 'beans' && <BeansDesigner integration={this.state.integration}
                                                   onSave={(integration) => this.save(integration)}
                                                   borderColor={this.props.borderColor}
                                                   borderColorSelected={this.props.borderColorSelected}
                                                   dark={this.props.dark}/>}
                {tab === 'dependencies' && <DependenciesDesigner integration={this.state.integration}
                                                   onSave={(integration) => this.save(integration)}
                                                   borderColor={this.props.borderColor}
                                                   borderColorSelected={this.props.borderColorSelected}
                                                   dark={this.props.dark}/>}
                {tab === 'error' && <ErrorDesigner integration={this.state.integration}
                                                   onSave={(integration) => this.save(integration)}
                                                   borderColor={this.props.borderColor}
                                                   borderColorSelected={this.props.borderColorSelected}
                                                   dark={this.props.dark}/>}
                {tab === 'exception' && <ExceptionDesigner integration={this.state.integration}
                                                           onSave={(integration) => this.save(integration)}
                                                           borderColor={this.props.borderColor}
                                                           borderColorSelected={this.props.borderColorSelected}
                                                           dark={this.props.dark}/>}
                {tab === 'templates' && <TemplatesDesigner integration={this.state.integration}
                                                           onSave={(integration) => this.save(integration)}
                                                           borderColor={this.props.borderColor}
                                                           borderColorSelected={this.props.borderColorSelected}
                                                           dark={this.props.dark}/>}
            </PageSection>
        );
    }
}
