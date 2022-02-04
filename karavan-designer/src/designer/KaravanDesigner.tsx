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
    Button, Modal,
    PageSection, Tab, Tabs, TabTitleIcon, TabTitleText, Tooltip,
} from '@patternfly/react-core';
import './karavan.css';
import {DslSelector} from "./DslSelector";
import {DslMetaModel} from "karavan-core/lib/model/DslMetaModel";
import {DslProperties} from "./DslProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {CamelElement, FromDefinition, Integration} from "karavan-core/lib/model/CamelDefinition";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslConnections} from "./DslConnections";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {DslElement} from "./DslElement";
import {EventBus} from "./EventBus";

interface Props {
    onSave?: (filename: string, yaml: string) => void
    filename: string
    yaml: string
    borderColor: string
    borderColorSelected: string
    dark: boolean
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    showSelector: boolean
    showDeleteConfirmation: boolean
    parentId: string
    parentDsl?: string
    showSteps: boolean
    selectedUuid: string
    key: string
    width: number
    height: number
    top: number
}

export class KaravanDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.yaml
            ? CamelDefinitionYaml.yamlToIntegration(this.props.filename, this.props.yaml)
            : Integration.createNew(this.props.filename),
        showSelector: false,
        showDeleteConfirmation: false,
        parentId: '',
        showSteps: true,
        selectedUuid: '',
        key: "",
        width: 1000,
        height: 1000,
        top: 0,
    };

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = () => {
        this.setState({key: Math.random().toString()});
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration.metadata.name, this.getCode(this.state.integration));
        }
    }

    unselectElement = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'FLOWS') {
            evt.stopPropagation()
            this.setState({selectedStep: undefined, selectedUuid: '', showSelector: false})
        }
    };

    getCode = (integration: Integration): string => {
        const clone = CamelUtil.cloneIntegration(integration);
        return CamelDefinitionYaml.integrationToYaml(clone);
    }

    onPropertyUpdate = (element: CamelElement, updatedUuid: string) => {
        const clone = CamelUtil.cloneIntegration(this.state.integration);
        const i = CamelDefinitionApiExt.updateIntegration(clone, element, updatedUuid);
        this.setState({integration: i, key: Math.random().toString()});
    }

    showDeleteConfirmation = (id: string) => {
        this.setState({selectedUuid: id, showSelector: false, showDeleteConfirmation: true});
    }

    deleteElement = () => {
        const id = this.state.selectedUuid;
        const i = CamelDefinitionApiExt.deleteStepFromIntegration(this.state.integration, id);
        this.setState({
            integration: i,
            showSelector: false,
            showDeleteConfirmation: false,
            key: Math.random().toString(),
            selectedStep: undefined,
            selectedUuid: ''
        });
        const el = new CamelElement("");
        el.uuid = id;
        EventBus.sendPosition("delete", el, undefined, new DOMRect(), new DOMRect(), 0);
    }

    selectElement = (element: CamelElement) => {
        this.setState({selectedStep: element, selectedUuid: element.uuid, showSelector: false})
    }

    openSelector = (parentId: string | undefined, parentDsl: string | undefined, showSteps: boolean = true) => {
        this.setState({showSelector: true, parentId: parentId || '', parentDsl: parentDsl, showSteps: showSteps})
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    onDslSelect = (dsl: DslMetaModel, parentId: string) => {
        switch (dsl.dsl) {
            case 'FromDefinition' :
                const from = CamelDefinitionApi.createRouteDefinition({from: new FromDefinition({uri: dsl.uri})});
                this.addStep(from, parentId)
                break;
            case 'ToDefinition' :
                const to = CamelDefinitionApi.createStep(dsl.dsl, {uri: dsl.uri});
                this.addStep(to, parentId)
                break;
            case 'ToDynamicDefinition' :
                const toD = CamelDefinitionApi.createStep(dsl.dsl, {uri: dsl.uri});
                this.addStep(toD, parentId)
                break;
            case 'KameletDefinition' :
                const kamelet = CamelDefinitionApi.createStep(dsl.dsl, {name: dsl.name});
                this.addStep(kamelet, parentId)
                break;
            default:
                const step = CamelDefinitionApi.createStep(dsl.dsl, undefined);
                this.addStep(step, parentId)
                break;
        }
    }

    addStep = (step: CamelElement, parentId: string) => {
        const i = CamelDefinitionApiExt.addStepToIntegration(this.state.integration, step, parentId);
        const clone = CamelUtil.cloneIntegration(i);
        this.setState({
            integration: clone,
            key: Math.random().toString(),
            showSelector: false,
            selectedStep: step,
            selectedUuid: step.uuid
        });
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, showSelector: false, key: Math.random().toString()});
    }

    moveElement = (source: string, target: string) => {
        const i = CamelDefinitionApiExt.moveElement(this.state.integration, source, target);
        const clone = CamelUtil.cloneIntegration(i);
        const selectedStep = CamelDefinitionApiExt.findElementInIntegration(clone, source);
        this.setState({
            integration: clone,
            key: Math.random().toString(),
            showSelector: false,
            selectedStep: selectedStep,
            selectedUuid: source
        });
    }

    onResizePage(el: HTMLDivElement | null) {
        const rect = el?.getBoundingClientRect();
        if (el && rect && (rect?.width !== this.state.width || rect.height !== this.state.height || rect.top !== this.state.top)) {
            this.setState({width: rect.width, height: rect.height, top: rect.top});
        }
    }

    getSelectorModal() {
        return (
            <Modal
                title={this.state.parentDsl === undefined ? "Select source/from" : "Select step"}
                width={'90%'}
                className='dsl-modal'
                isOpen={this.state.showSelector}
                onClose={() => this.closeDslSelector()}
                actions={{}}>
                <DslSelector
                    dark={this.props.dark}
                    parentId={this.state.parentId}
                    parentDsl={this.state.parentDsl}
                    showSteps={this.state.showSteps}
                    onDslSelect={this.onDslSelect}/>
            </Modal>)
    }

    getDeleteConfirmation() {
        return (<Modal
            className="modal-delete"
            title="Confirmation"
            isOpen={this.state.showDeleteConfirmation}
            onClose={() => this.setState({showDeleteConfirmation: false})}
            actions={[
                <Button key="confirm" variant="primary" onClick={e => this.deleteElement()}>Delete</Button>,
                <Button key="cancel" variant="link"
                        onClick={e => this.setState({showDeleteConfirmation: false})}>Cancel</Button>
            ]}
            onEscapePress={e => this.setState({showDeleteConfirmation: false})}>
            <div>
                Delete element from integration?
            </div>
        </Modal>)
    }

    getGraph() {
        return (
            <div className="graph">
                <DslConnections height={this.state.height} width={this.state.width} top={this.state.top} integration={this.state.integration}/>
                <div className="flows" data-click="FLOWS" onClick={event => this.unselectElement(event)}
                     ref={el => this.onResizePage(el)}>
                    {this.state.integration.spec.flows?.map((from: any, index: number) => (
                        <DslElement key={from.uuid + this.state.key}
                                    openSelector={this.openSelector}
                                    deleteElement={this.showDeleteConfirmation}
                                    selectElement={this.selectElement}
                                    moveElement={this.moveElement}
                                    selectedUuid={this.state.selectedUuid}
                                    borderColor={this.props.borderColor}
                                    borderColorSelected={this.props.borderColorSelected}
                                    inSteps={false}
                                    position={index}
                                    step={from}
                                    parent={undefined}/>
                    ))}
                    <div className="add-flow">
                        <Button
                            variant={this.state.integration.spec.flows?.length === 0 ? "primary" : "secondary"}
                            data-click="ADD_ROUTE"
                            icon={<PlusIcon/>}
                            onClick={e => this.openSelector(undefined, undefined)}>Add new route
                        </Button>
                    </div>
                </div>
            </div>)
    }

    getTab(title: string, tooltip: string, icon: string) {
        return (
            <Tooltip position={"bottom"}
                     content={<div>{tooltip}</div>}>
                <div className="top-menu-item">
                    <TabTitleIcon>{this.getIcon(icon)}</TabTitleIcon>
                    <TabTitleText>{title}</TabTitleText>
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
            <svg className="top-icon" viewBox="0 0 536.243 536.242" >
                <g>
                    <path d="M471.053,197.07c-94.2-101.601-284-183.601-423.5-154.2c-9.2,1.8-12.9,9.2-12.2,16.5c-86.9,47.7,9.2,213,45.9,261.3
                        c72.2,96.1,200.701,203.2,329.901,173.8c60-13.5,103.399-69.8,120-126.1C550.053,304.77,513.253,242.37,471.053,197.07z
                         M393.353,465.17c-102.199,23.3-210.5-75.9-271.7-145c-61.2-70.4-108.3-155.4-71-243c83.8,151.8,253.4,269.3,414.9,321.899
                        c19.601,6.101,28.2-24.5,8.601-31.199C318.753,315.27,166.353,209.97,73.953,72.27c111.4-13.5,238.701,45.9,326.201,107.101
                        c50.199,35.5,98.5,87.5,102.8,151.8C505.954,394.17,451.454,451.67,393.353,465.17z"/>
                </g>
            </svg>
        )
        if (icon === 'error') return (
            <svg className="top-icon" width="36px" height="36px" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet">
                <circle className="clr-i-outline clr-i-outline-path-1" cx="18" cy="26.06" r="1.33"/>
                <path className="clr-i-outline clr-i-outline-path-2" d="M18,22.61a1,1,0,0,1-1-1v-12a1,1,0,1,1,2,0v12A1,1,0,0,1,18,22.61Z"/>
                <path className="clr-i-outline clr-i-outline-path-3" d="M18,34A16,16,0,1,1,34,18,16,16,0,0,1,18,34ZM18,4A14,14,0,1,0,32,18,14,14,0,0,0,18,4Z"/>
                <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
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
        return (
            <PageSection className="dsl-page" isFilled padding={{default: 'noPadding'}}>
                <div className="dsl-page-columns">
                    <div style={{width: "100%"}}>
                        <Tabs isFilled className="main-tabs" activeKey={0} onSelect={event => {
                        }} style={{width: "100%"}}>
                            <Tab eventKey={0} title={this.getTab("Routes", "Integration flows", "routes")}></Tab>
                            <Tab eventKey={1} title={this.getTab("REST", "REST services","rest")}></Tab>
                            <Tab eventKey={2} title={this.getTab("Beans", "Beans Configuration","beans")}></Tab>
                            <Tab eventKey={3} title={this.getTab("Error Handler","Error Handler configuration", "error")}></Tab>
                            <Tab eventKey={4} title={this.getTab("Exception Clauses","Exception Clauses per type", "exception")}></Tab>
                            <Tab eventKey={5} title={this.getTab("Templates", "Route Templates","template")}></Tab>
                        </Tabs>
                        {this.getGraph()}
                    </div>
                    <DslProperties
                        integration={this.state.integration}
                        step={this.state.selectedStep}
                        onIntegrationUpdate={this.onIntegrationUpdate}
                        onPropertyUpdate={this.onPropertyUpdate}
                    />
                </div>
                {this.getSelectorModal()}
                {this.getDeleteConfirmation()}
            </PageSection>
        );
    }
}
