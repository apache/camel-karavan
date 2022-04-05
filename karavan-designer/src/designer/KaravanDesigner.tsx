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
import {TemplatesDesigner} from "./templates/TemplatesDesigner";
import {ExceptionDesigner} from "./exception/ExceptionDesigner";
import {DependenciesDesigner} from "./dependencies/DependenciesDesigner";
import {TraitsDesigner} from "./traits/TraitsDesigner";

interface Props {
    onSave?: (filename: string, yaml: string, propertyOnly: boolean) => void
    filename: string
    yaml: string
    dark: boolean
}

interface State {
    tab: string,
    integration: Integration,
    key: string
    propertyOnly: boolean
}

export class KaravanDesigner extends React.Component<Props, State> {

    public state: State = {
        tab: 'routes',
        integration: this.props.yaml && CamelDefinitionYaml.yamlIsIntegration(this.props.yaml)
            ? CamelDefinitionYaml.yamlToIntegration(this.props.filename, this.props.yaml)
            : Integration.createNew(this.props.filename),
        key: "",
        propertyOnly: false
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
                    <TabTitleIcon>{this.getIcon(icon)}</TabTitleIcon>
                    <TabTitleText>{title}</TabTitleText>
                    {showCount && <Badge isRead className="count">{counts.get(icon)}</Badge>}
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
        if (icon === 'traits') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
                <defs>
                    <style>{".cls-1{fill:none;}"}</style>
                </defs>
                <title>settings</title>
                <path
                    d="M27,16.76c0-.25,0-.5,0-.76s0-.51,0-.77l1.92-1.68A2,2,0,0,0,29.3,11L26.94,7a2,2,0,0,0-1.73-1,2,2,0,0,0-.64.1l-2.43.82a11.35,11.35,0,0,0-1.31-.75l-.51-2.52a2,2,0,0,0-2-1.61H13.64a2,2,0,0,0-2,1.61l-.51,2.52a11.48,11.48,0,0,0-1.32.75L7.43,6.06A2,2,0,0,0,6.79,6,2,2,0,0,0,5.06,7L2.7,11a2,2,0,0,0,.41,2.51L5,15.24c0,.25,0,.5,0,.76s0,.51,0,.77L3.11,18.45A2,2,0,0,0,2.7,21L5.06,25a2,2,0,0,0,1.73,1,2,2,0,0,0,.64-.1l2.43-.82a11.35,11.35,0,0,0,1.31.75l.51,2.52a2,2,0,0,0,2,1.61h4.72a2,2,0,0,0,2-1.61l.51-2.52a11.48,11.48,0,0,0,1.32-.75l2.42.82a2,2,0,0,0,.64.1,2,2,0,0,0,1.73-1L29.3,21a2,2,0,0,0-.41-2.51ZM25.21,24l-3.43-1.16a8.86,8.86,0,0,1-2.71,1.57L18.36,28H13.64l-.71-3.55a9.36,9.36,0,0,1-2.7-1.57L6.79,24,4.43,20l2.72-2.4a8.9,8.9,0,0,1,0-3.13L4.43,12,6.79,8l3.43,1.16a8.86,8.86,0,0,1,2.71-1.57L13.64,4h4.72l.71,3.55a9.36,9.36,0,0,1,2.7,1.57L25.21,8,27.57,12l-2.72,2.4a8.9,8.9,0,0,1,0,3.13L27.57,20Z"
                    transform="translate(0 0)"/>
                <path d="M16,22a6,6,0,1,1,6-6A5.94,5.94,0,0,1,16,22Zm0-10a3.91,3.91,0,0,0-4,4,3.91,3.91,0,0,0,4,4,3.91,3.91,0,0,0,4-4A3.91,3.91,0,0,0,16,12Z"
                      transform="translate(0 0)"/>
                <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" className="cls-1" width="32" height="32"/>
            </svg>)
        if (icon === 'yaml') return (
            <svg className="top-icon" x="0px" y="0px" width="32px" height="32px"
                 viewBox="0 0 32 32">
                <style type="text/css">{".st0{fill:none;}"}</style>
                <title>document</title>
                <path
                    d="M25.7,9.3l-7-7C18.5,2.1,18.3,2,18,2H8C6.9,2,6,2.9,6,4v24c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V10C26,9.7,25.9,9.5,25.7,9.3  z M18,4.4l5.6,5.6H18V4.4z M24,28H8V4h8v6c0,1.1,0.9,2,2,2h6V28z"/>
                <rect x="10" y="22" width="12" height="2"/>
                <rect x="10" y="16" width="12" height="2"/>
                <rect className="st0" width="32" height="32"/>
            </svg>)
        if (icon === 'code') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
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
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} className="page" isFilled padding={{default: 'noPadding'}}>
                <Tabs className="main-tabs" activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex.toString()})} style={{width: "100%"}}>
                    <Tab eventKey='routes' title={this.getTab("Routes", "Integration flows", "routes")}></Tab>
                    <Tab eventKey='rest' title={this.getTab("REST", "REST services", "rest")}></Tab>
                    <Tab eventKey='beans' title={this.getTab("Beans", "Beans Configuration", "beans")}></Tab>
                    <Tab eventKey='dependencies' title={this.getTab("Dependencies", "Dependencies", "dependencies")}></Tab>
                    <Tab eventKey='traits' title={this.getTab("Traits", "traits configuration", "traits")}></Tab>
                    <Tab eventKey='error' title={this.getTab("Error", "Error Handler", "error")}></Tab>
                    <Tab eventKey='exception' title={this.getTab("Exceptions", "Exception Clauses per type", "exception")}></Tab>
                    {/*<Tab eventKey='code' title={this.getTab("Code", "Code", "code")}></Tab>*/}
                </Tabs>
                {tab === 'routes' && <RouteDesigner integration={this.state.integration}
                                                    onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                    dark={this.props.dark}/>}
                {tab === 'rest' && <RestDesigner integration={this.state.integration}
                                                 onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                 dark={this.props.dark}/>}
                {tab === 'beans' && <BeansDesigner integration={this.state.integration}
                                                   onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                   dark={this.props.dark}/>}
                {tab === 'dependencies' && <DependenciesDesigner integration={this.state.integration}
                                                                 onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                                 dark={this.props.dark}/>}
                {tab === 'error' && <ErrorDesigner integration={this.state.integration}
                                                   onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                   dark={this.props.dark}/>}
                {tab === 'exception' && <ExceptionDesigner integration={this.state.integration}
                                                           onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                           dark={this.props.dark}/>}
                {tab === 'traits' && <TraitsDesigner integration={this.state.integration}
                                                           onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                           dark={this.props.dark}/>}
            </PageSection>
        );
    }
}
