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
    Badge, Button, Checkbox, Modal, ModalVariant,
    PageSection, PageSectionVariants, Tab, Tabs, TabTitleIcon, TabTitleText, Title, Tooltip,
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
import KaravanTour from "./KaravanTour";
import WandIcon from "@patternfly/react-icons/dist/js/icons/magic-icon";
import {getDesignerIcon} from "./utils/KaravanIcons";

interface Props {
    onSave?: (filename: string, yaml: string, propertyOnly: boolean) => void
    onDisableHelp?: () => void
    filename: string
    yaml: string
    dark: boolean
    showStartHelp: boolean
    tab?: string
}

interface State {
    tab: string
    integration: Integration
    key: string
    propertyOnly: boolean
    showTour: boolean
    showStartHelp: boolean
    cancelTour: boolean
}

export class KaravanDesigner extends React.Component<Props, State> {

    public state: State = {
        tab: this.props.tab ? this.props.tab : 'routes',
        integration: this.props.yaml && CamelDefinitionYaml.yamlIsIntegration(this.props.yaml)
            ? CamelDefinitionYaml.yamlToIntegration(this.props.filename, this.props.yaml)
            : Integration.createNew(this.props.filename),
        key: "",
        propertyOnly: false,
        showTour: false,
        showStartHelp: this.props.showStartHelp,
        cancelTour: false,
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

    closeHelpWindow(showTour: boolean){
        this.setState({showStartHelp: false, showTour: showTour});
        if (this.state.cancelTour) this.props.onDisableHelp?.call(this);
    }

    getHelpWindow() {
        const show = this.state.showStartHelp && this.state.integration.spec.flows?.filter(f => f.dslName === 'RouteDefinition').length === 0;
        return (<Modal
            aria-label="Welcome"
            className="modal-help"
            title="Welcome to Karavan!"
            header={<div  style={{display:"flex"}}><WandIcon style={{marginTop:"auto", marginBottom:"auto", marginRight:"10px"}}/><Title headingLevel={"h2"}>Welcome to Karavan!</Title></div>}
            variant={ModalVariant.small}
            isOpen={show}
            onClose={() => this.closeHelpWindow(false)}
            actions={[
                <Checkbox key="check" className="dont-show" label="Don't show again" isChecked={this.state.cancelTour} onChange={checked => this.setState({cancelTour: checked})} aria-label="Don't show again" id="dont-show"/>,
                <Button key="skip" variant={"secondary"} isSmall onClick={e => this.closeHelpWindow(false)}>Skip tour</Button>,
                <Button key="tour" autoFocus={true} variant={"primary"} isSmall onClick={e => this.closeHelpWindow(true)}>Get started</Button>
            ]}
            onEscapePress={e =>  this.closeHelpWindow(false)}>
                Get started with a tour of the key areas that can help you complete integration and be more productive.
        </Modal>)
    }

    render() {
        const tab = this.state.tab;
        return (
            <PageSection variant={this.props.dark ? PageSectionVariants.darker : PageSectionVariants.light} className="page" isFilled padding={{default: 'noPadding'}}>
                {this.state.showTour && <KaravanTour tab="routes"
                                                     integration={this.state.integration}
                                                     onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                     showTour={this.state.showTour}
                                                     onClose={() => this.setState({showTour: false})} />}
                <Tabs className="main-tabs" activeKey={tab} onSelect={(event, tabIndex) => this.setState({tab: tabIndex.toString()})} style={{width: "100%"}}>
                    <Tab data-tour="routes" eventKey='routes' title={this.getTab("Routes", "Integration flows", "routes")}></Tab>
                    <Tab eventKey='rest' title={this.getTab("REST", "REST services", "rest")}></Tab>
                    <Tab eventKey='beans' title={this.getTab("Beans", "Beans Configuration", "beans")}></Tab>
                    <Tab eventKey='error' title={this.getTab("Error", "Error Handler", "error")}></Tab>
                    <Tab eventKey='exception' title={this.getTab("Exceptions", "Exception Clauses per type", "exception")}></Tab>
                </Tabs>
                {tab === 'routes' && <RouteDesigner integration={this.state.integration}
                                                    showTour={this.state.showTour}
                                                    onSave={(integration, propertyOnly) => this.save(integration, propertyOnly)}
                                                    dark={this.props.dark}/>}
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
                {this.getHelpWindow()}
            </PageSection>
        )
    }
}
