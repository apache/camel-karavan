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
    Drawer,
    DrawerPanelContent,
    DrawerContent,
    DrawerContentBody,
    DrawerHead,
    DrawerActions,
    DrawerCloseButton,
    Button, Modal,
    PageSection
} from '@patternfly/react-core';
import '../karavan.css';
import {DslSelector} from "./DslSelector";
import {DslMetaModel} from "../utils/DslMetaModel";
import {DslProperties} from "./DslProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {FromDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslConnections} from "./DslConnections";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {DslElement} from "./DslElement";
import {EventBus} from "../utils/EventBus";
import {CamelUi, RouteToCreate} from "../utils/CamelUi";
import {findDOMNode} from "react-dom";

interface Props {
    onSave?: (integration: Integration) => void
    integration: Integration
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
    left: number
    clipboardStep?: CamelElement
    ref?: any
}

export class RouteDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showSelector: false,
        showDeleteConfirmation: false,
        parentId: '',
        showSteps: true,
        selectedUuid: '',
        key: "",
        width: 1000,
        height: 1000,
        top: 0,
        left: 0,
        ref: React.createRef()
    };

    componentDidMount() {
        window.addEventListener('resize', this.handleResize);
        const element = findDOMNode(this.state.ref.current)?.parentElement?.parentElement;
        const checkResize = (mutations: any) => {
            const el = mutations[0].target;
            const w = el.clientWidth;
            const isChange = mutations.map((m: any) => `${m.oldValue}`).some((prev: any) => prev.indexOf(`width: ${w}px`) === -1);
            if (isChange) this.setState({key: Math.random().toString()});
        }
        if (element) {
            const observer = new MutationObserver(checkResize);
            observer.observe(element, {attributes: true, attributeOldValue: true, attributeFilter: ['style']});
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = (event: any) => {
        this.setState({key: Math.random().toString()});
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key) {
            this.props.onSave?.call(this, this.state.integration);
        }
    }

    saveToClipboard = (step?: CamelElement): void => {
        this.setState({clipboardStep: step, key: Math.random().toString()});
    }

    unselectElement = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'FLOWS') {
            evt.stopPropagation()
            this.setState({selectedStep: undefined, selectedUuid: '', showSelector: false})
        }
    };

    onPropertyUpdate = (element: CamelElement, updatedUuid: string, newRoute?: RouteToCreate) => {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationRouteElement(this.state.integration, element);
            const f = CamelDefinitionApi.createFromDefinition({uri: newRoute.componentName + ":" + newRoute.name})
            const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.name})
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            this.setState({
                integration: clone,
                key: Math.random().toString(),
                showSelector: false,
                selectedStep: element,
                selectedUuid: element.uuid
            });
        } else {
            const clone = CamelUtil.cloneIntegration(this.state.integration);
            const i = CamelDefinitionApiExt.updateIntegrationRouteElement(clone, element);
            this.setState({integration: i, key: Math.random().toString()});
        }
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
        const i = CamelDefinitionApiExt.moveRouteElement(this.state.integration, source, target);
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
        if (el && rect && (el.scrollWidth !== this.state.width || el.scrollHeight !== this.state.height || rect.top !== this.state.top || rect.left !== this.state.left)) {
            this.setState({width: el.scrollWidth, height: el.scrollHeight, top: rect.top, left: rect.left})
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
        const routes = CamelUi.getRoutes(this.state.integration);
        return (
            <div className="graph">
                <DslConnections height={this.state.height} width={this.state.width} top={this.state.top} left={this.state.left} integration={this.state.integration}/>
                <div className="flows" data-click="FLOWS" onClick={event => this.unselectElement(event)}
                     ref={el => this.onResizePage(el)}>
                    {routes?.map((route: any, index: number) => (
                        <DslElement key={route.uuid + this.state.key}
                                    openSelector={this.openSelector}
                                    deleteElement={this.showDeleteConfirmation}
                                    selectElement={this.selectElement}
                                    moveElement={this.moveElement}
                                    selectedUuid={this.state.selectedUuid}
                                    inSteps={false}
                                    position={index}
                                    step={route}
                                    parent={undefined}/>
                    ))}
                    <div className="add-flow">
                        <Button
                            variant={routes.length === 0 ? "primary" : "secondary"}
                            data-click="ADD_ROUTE"
                            icon={<PlusIcon/>}
                            onClick={e => this.openSelector(undefined, undefined)}>Create new route
                        </Button>
                    </div>
                </div>
            </div>)
    }

    getPropertiesPanel() {
        return (
            <DrawerPanelContent isResizable hasNoBorder defaultSize={'400px'} maxSize={'800px'} minSize={'300px'}>
                    <DslProperties ref={this.state.ref}
                        integration={this.state.integration}
                        step={this.state.selectedStep}
                        onIntegrationUpdate={this.onIntegrationUpdate}
                        onPropertyUpdate={this.onPropertyUpdate}
                        clipboardStep={this.state.clipboardStep}
                        onSaveClipboardStep={this.saveToClipboard}
                    />
            </DrawerPanelContent>
        )
    }

    render() {
        return (
            <PageSection className="dsl-page" isFilled padding={{default: 'noPadding'}}>
                <div className="dsl-page-columns">
                    <Drawer isExpanded isInline>
                        <DrawerContent panelContent={this.getPropertiesPanel()}>
                            <DrawerContentBody>{this.getGraph()}</DrawerContentBody>
                        </DrawerContent>
                    </Drawer>
                </div>
                {this.getSelectorModal()}
                {this.getDeleteConfirmation()}
            </PageSection>
        );
    }
}
