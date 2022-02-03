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
    PageSection, Tab, Tabs, TabTitleIcon, TabTitleText,
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
import {CamelUi} from "./CamelUi";

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

    getTab(title: string, icon: string) {
        return (
            <>
                <TabTitleIcon>{this.getIcon(icon)}</TabTitleIcon>
                <TabTitleText>{title}</TabTitleText>
            </>
        )
    }

    getIcon(icon: string) {
        if (icon === 'routes') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
                <defs>
                    <style>{".cls-1{fill:none;}"}</style>
                </defs>
                <title>category--new-each</title>
                <path d="M29,10H24v2h5v6H22v2h3v2.142a4,4,0,1,0,2,0V20h2a2.0027,2.0027,0,0,0,2-2V12A2.0023,2.0023,0,0,0,29,10ZM28,26a2,2,0,1,1-2-2A2.0027,2.0027,0,0,1,28,26Z"/>
                <path d="M19,6H14V8h5v6H12v2h3v6.142a4,4,0,1,0,2,0V16h2a2.0023,2.0023,0,0,0,2-2V8A2.0023,2.0023,0,0,0,19,6ZM18,26a2,2,0,1,1-2-2A2.0027,2.0027,0,0,1,18,26Z"/>
                <path
                    d="M9,2H3A2.002,2.002,0,0,0,1,4v6a2.002,2.002,0,0,0,2,2H5V22.142a4,4,0,1,0,2,0V12H9a2.002,2.002,0,0,0,2-2V4A2.002,2.002,0,0,0,9,2ZM8,26a2,2,0,1,1-2-2A2.0023,2.0023,0,0,1,8,26ZM3,10V4H9l.0015,6Z"/>
                <rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" className="cls-1" width="32" height="32"/>
            </svg>)
        if (icon === 'rest') return (
            <svg className="top-icon" width="32px" height="32px" viewBox="0 0 32 32" id="icon">
                <defs>
                    <style>{".cls-1{fill:none;"}</style>
                </defs>
                <title>api</title>
                <path
                    d="M26,22a3.86,3.86,0,0,0-2,.57l-3.09-3.1a6,6,0,0,0,0-6.94L24,9.43A3.86,3.86,0,0,0,26,10a4,4,0,1,0-4-4,3.86,3.86,0,0,0,.57,2l-3.1,3.09a6,6,0,0,0-6.94,0L9.43,8A3.86,3.86,0,0,0,10,6a4,4,0,1,0-4,4,3.86,3.86,0,0,0,2-.57l3.09,3.1a6,6,0,0,0,0,6.94L8,22.57A3.86,3.86,0,0,0,6,22a4,4,0,1,0,4,4,3.86,3.86,0,0,0-.57-2l3.1-3.09a6,6,0,0,0,6.94,0L22.57,24A3.86,3.86,0,0,0,22,26a4,4,0,1,0,4-4ZM26,4a2,2,0,1,1-2,2A2,2,0,0,1,26,4ZM4,6A2,2,0,1,1,6,8,2,2,0,0,1,4,6ZM6,28a2,2,0,1,1,2-2A2,2,0,0,1,6,28Zm10-8a4,4,0,1,1,4-4A4,4,0,0,1,16,20Zm10,8a2,2,0,1,1,2-2A2,2,0,0,1,26,28Z"
                    transform="translate(0 0)"/>
                <rect className="cls-1" width="32" height="32"/>
            </svg>)
        if (icon === 'beans') return (
            <svg className="top-icon" x="0px" y="0px" viewBox="0 0 512 512">
                <g>
                    <path
                        d="M230.278,44.299C208.041,15.732,178.095,0,145.956,0c-32.139,0-62.083,15.734-84.32,44.302    c-21.274,27.332-32.99,63.435-32.988,101.659c0,38.223,11.717,74.326,32.992,101.658c22.238,28.567,52.184,44.3,84.322,44.299    s62.083-15.734,84.32-44.303c21.274-27.332,32.988-63.435,32.988-101.658C263.269,107.734,251.552,71.63,230.278,44.299z     M130.909,224.909c-3.725,7.761-7.778,16.214-10.086,28.415c-12.135-5.156-23.355-14.04-32.834-26.217    c-16.734-21.497-25.95-50.316-25.95-81.148s9.214-59.65,25.947-81.148c13.814-17.747,31.323-28.511,49.98-30.908    c-1.568,7.182-4.125,12.535-7.06,18.651c-5.618,11.704-11.985,24.968-11.985,50.31c0,25.344,6.369,38.609,11.986,50.314    c4.86,10.123,8.697,18.119,8.697,35.865S135.768,214.785,130.909,224.909z M203.932,227.106    c-13.814,17.747-31.323,28.511-49.981,30.908c1.569-7.186,4.125-12.54,7.061-18.658c5.617-11.705,11.985-24.971,11.984-50.315    c-0.001-25.344-6.369-38.609-11.986-50.314c-4.86-10.123-8.697-18.119-8.697-35.865c0-17.742,3.838-25.737,8.696-35.859    c3.724-7.76,7.777-16.211,10.086-28.41c12.134,5.154,23.355,14.038,32.834,26.216c16.733,21.498,25.949,50.317,25.951,81.149    C229.879,176.789,220.665,205.608,203.932,227.106z"/>
                    <path
                        d="M450.36,264.381c-22.237-28.567-52.184-44.3-84.322-44.299c-32.139,0-62.083,15.734-84.321,44.302    c-21.272,27.332-32.988,63.435-32.988,101.659c0.001,38.224,11.718,74.326,32.993,101.658    c22.237,28.567,52.184,44.3,84.322,44.299c32.139,0,62.083-15.734,84.321-44.302c21.272-27.332,32.99-63.435,32.988-101.659    C483.351,327.815,471.634,291.712,450.36,264.381z M350.991,444.993c-3.729,7.77-7.786,16.232-10.093,28.454    c-34.028-14.367-58.775-57.08-58.777-107.403c-0.001-58.455,33.389-106.64,75.927-112.056c-1.568,7.183-4.124,12.534-7.06,18.65    c-5.619,11.704-11.986,24.968-11.985,50.31c0.001,25.344,6.369,38.609,11.986,50.314c4.86,10.123,8.697,18.119,8.697,35.866    C359.687,426.873,355.85,434.868,350.991,444.993z M374.033,478.096c1.569-7.185,4.125-12.538,7.061-18.656    c5.617-11.705,11.985-24.971,11.984-50.315c-0.001-25.344-6.369-38.609-11.986-50.314c-4.86-10.123-8.697-18.119-8.697-35.866    c0-17.742,3.837-25.737,8.696-35.858c3.725-7.76,7.778-16.211,10.087-28.409c12.136,5.154,23.355,14.038,32.834,26.214    c16.733,21.497,25.949,50.316,25.949,81.148C449.962,424.495,416.572,472.68,374.033,478.096z"/>
                </g>
            </svg>)
        if (icon === 'error') return (
            <svg className="top-icon" width="36px" height="36px" viewBox="0 0 36 36" version="1.1" preserveAspectRatio="xMidYMid meet">
                <circle className="clr-i-outline clr-i-outline-path-1" cx="18" cy="26.06" r="1.33"/>
                <path className="clr-i-outline clr-i-outline-path-2" d="M18,22.61a1,1,0,0,1-1-1v-12a1,1,0,1,1,2,0v12A1,1,0,0,1,18,22.61Z"/>
                <path className="clr-i-outline clr-i-outline-path-3" d="M18,34A16,16,0,1,1,34,18,16,16,0,0,1,18,34ZM18,4A14,14,0,1,0,32,18,14,14,0,0,0,18,4Z"/>
                <rect x="0" y="0" width="36" height="36" fill-opacity="0"/>
            </svg>)
    }

    render() {
        return (
            <PageSection className="dsl-page" isFilled padding={{default: 'noPadding'}}>
                <div className="dsl-page-columns">
                    <div style={{width: "100%"}}>
                        <Tabs isFilled className="main-tabs" activeKey={0} onSelect={event => {
                        }} style={{width: "100%"}}>
                            <Tab eventKey={0} title={this.getTab("Routes", "routes")}></Tab>
                            <Tab eventKey={1} title={this.getTab("REST", "rest")}></Tab>
                            <Tab eventKey={2} title={this.getTab("Beans", "beans")}></Tab>
                            <Tab eventKey={3} title={this.getTab("Error Handler", "error")}></Tab>
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
