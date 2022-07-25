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
    Button, Modal,
    PageSection, Flex, FlexItem, Text
} from '@patternfly/react-core';
import '../karavan.css';
import {DslSelector} from "./DslSelector";
import {DslMetaModel} from "../utils/DslMetaModel";
import {DslProperties} from "./DslProperties";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {FromDefinition, RouteDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {DslConnections} from "./DslConnections";
import PlusIcon from "@patternfly/react-icons/dist/esm/icons/plus-icon";
import {DslElement} from "./DslElement";
import {EventBus, TourEvent} from "../utils/EventBus";
import {CamelUi, RouteToCreate} from "../utils/CamelUi";
import {findDOMNode} from "react-dom";
import {Subscription} from "rxjs";

interface Props {
    onSave?: (integration: Integration, propertyOnly: boolean) => void
    integration: Integration
    dark: boolean
    showTour: boolean
}

interface State {
    integration: Integration
    selectedStep?: CamelElement
    showSelector: boolean
    showDeleteConfirmation: boolean
    deleteMessage: string
    parentId: string
    parentDsl?: string
    selectedPosition?: number
    showSteps: boolean
    selectedUuid: string
    key: string
    width: number
    height: number
    top: number
    left: number
    clipboardStep?: CamelElement
    ref?: any
    propertyOnly: boolean
    sub?: Subscription
    selectorTabIndex?: string | number
    showTour: boolean
}

export class RouteDesigner extends React.Component<Props, State> {

    public state: State = {
        integration: this.props.integration,
        showSelector: false,
        showDeleteConfirmation: false,
        deleteMessage: '',
        parentId: '',
        showSteps: true,
        selectedUuid: '',
        key: "",
        width: 1000,
        height: 1000,
        top: 0,
        left: 0,
        ref: React.createRef(),
        propertyOnly: false,
        showTour: this.props.showTour,
    };

    componentDidMount() {
        const sub = EventBus.onTourEvent()?.subscribe((evt: TourEvent) => this.handleTourEvent(evt));
        this.setState({sub: sub});
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
        this.state.sub?.unsubscribe();
        window.removeEventListener('resize', this.handleResize);
    }

    handleResize = (event: any) => {
        this.setState({key: Math.random().toString()});
    }

    handleTourEvent = (event: TourEvent) => {
        const step = this.state.selectedStep;
        switch (event.command) {
            case "openSelector":
                this.openSelector(step?.uuid, !step?.dslName ? undefined : "FromDefinition", true, undefined, event.selectorTabIndex)
                break;
            case "closeSelector":
                if (event.step) {
                    const clone = CamelUtil.cloneIntegration(this.props.integration);
                    this.setState({
                        integration: clone,
                        key: Math.random().toString(),
                        showSelector: false,
                        selectedStep: event.step,
                        selectedUuid: event.step.uuid,
                        propertyOnly: false
                    });
                } else {
                    this.setState({showSelector: false, key: Math.random().toString()});
                }
                break;
            case "selectElement":
                if (event.step) this.selectElement(event.step);
                break;
        }
    }

    componentDidUpdate = (prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any) => {
        if (prevState.key !== this.state.key && !this.props.showTour) {
            this.props.onSave?.call(this, this.state.integration, this.state.propertyOnly);
        }
    }

    saveToClipboard = (step?: CamelElement): void => {
        this.setState({clipboardStep: step, key: Math.random().toString()});
    }

    unselectElement = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'FLOWS') {
            evt.stopPropagation()
            this.setState({selectedStep: undefined, selectedUuid: '', showSelector: false, selectedPosition: undefined})
        }
    };

    onPropertyUpdate = (element: CamelElement, newRoute?: RouteToCreate) => {
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
                selectedUuid: element.uuid,
                propertyOnly: false
            });
        } else {
            const clone = CamelUtil.cloneIntegration(this.state.integration);
            const i = CamelDefinitionApiExt.updateIntegrationRouteElement(clone, element);
            this.setState({integration: i, propertyOnly: true, key: Math.random().toString()});
        }
    }

    showDeleteConfirmation = (id: string) => {
        let message: string;
        let ce: CamelElement;
        ce = CamelDefinitionApiExt.findElementInIntegration(this.state.integration, id)!;
        if (ce.dslName === 'FromDefinition') { // Get the RouteDefinition for this.  Use its uuid.
            let flows = this.state.integration.spec.flows!;
            for (let i = 0; i < flows.length; i++) {
                if (flows[i].dslName === 'RouteDefinition') {
                    let routeDefinition: RouteDefinition = flows[i];
                    if (routeDefinition.from.uuid === id) {
                        id = routeDefinition.uuid;
                        break;
                    }
                }
            }
            message = 'Deleting the first element will delete the entire route!';
        } else if (ce.dslName === 'RouteDefinition') {
            message = 'Delete route?';
        } else {
            message = 'Delete element from route?';
        }
        this.setState({selectedUuid: id, showSelector: false, showDeleteConfirmation: true, deleteMessage: message});
    }

    deleteElement = () => {
        const id = this.state.selectedUuid;
        const i = CamelDefinitionApiExt.deleteStepFromIntegration(this.state.integration, id);
        this.setState({
            integration: i,
            showSelector: false,
            showDeleteConfirmation: false,
            deleteMessage: '',
            key: Math.random().toString(),
            selectedStep: undefined,
            selectedUuid: '',
            propertyOnly: false
        });
        const el = new CamelElement("");
        el.uuid = id;
        EventBus.sendPosition("delete", el, undefined, new DOMRect(), new DOMRect(), 0);
    }

    selectElement = (element: CamelElement) => {
        this.setState({selectedStep: element, selectedUuid: element.uuid, showSelector: false})
    }

    openSelector = (parentId: string | undefined, parentDsl: string | undefined, showSteps: boolean = true, position?: number | undefined, selectorTabIndex?: string | number) => {
        this.setState({
            showSelector: true,
            parentId: parentId || '',
            parentDsl: parentDsl,
            showSteps: showSteps,
            selectedPosition: position,
            selectorTabIndex: selectorTabIndex
        })
    }

    closeDslSelector = () => {
        this.setState({showSelector: false})
    }

    onDslSelect = (dsl: DslMetaModel, parentId: string, position?: number | undefined) => {
        switch (dsl.dsl) {
            case 'FromDefinition' :
                const from = CamelDefinitionApi.createRouteDefinition({from: new FromDefinition({uri: dsl.uri})});
                this.addStep(from, parentId, position)
                break;
            case 'ToDefinition' :
                const to = CamelDefinitionApi.createStep(dsl.dsl, {uri: dsl.uri});
                this.addStep(to, parentId, position)
                break;
            case 'ToDynamicDefinition' :
                const toD = CamelDefinitionApi.createStep(dsl.dsl, {uri: dsl.uri});
                this.addStep(toD, parentId, position)
                break;
            case 'KameletDefinition' :
                const kamelet = CamelDefinitionApi.createStep(dsl.dsl, {name: dsl.name});
                this.addStep(kamelet, parentId, position)
                break;
            default:
                const step = CamelDefinitionApi.createStep(dsl.dsl, undefined);
                this.addStep(step, parentId, position)
                break;
        }
    }

    addStep = (step: CamelElement, parentId: string, position?: number | undefined) => {
        const i = CamelDefinitionApiExt.addStepToIntegration(this.state.integration, step, parentId, position);
        const clone = CamelUtil.cloneIntegration(i);
        this.setState({
            integration: clone,
            key: Math.random().toString(),
            showSelector: false,
            selectedStep: step,
            selectedUuid: step.uuid,
            propertyOnly: false
        });
    }

    onIntegrationUpdate = (i: Integration) => {
        this.setState({integration: i, propertyOnly: false, showSelector: false, key: Math.random().toString()});
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
            selectedUuid: source,
            propertyOnly: false
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
            <DslSelector
                isOpen={this.state.showSelector}
                onClose={() => this.closeDslSelector()}
                dark={this.props.dark}
                parentId={this.state.parentId}
                parentDsl={this.state.parentDsl}
                showSteps={this.state.showSteps}
                position={this.state.selectedPosition}
                tabIndex={this.state.selectorTabIndex}
                onDslSelect={this.onDslSelect}/>)
    }

    getDeleteConfirmation() {
        let htmlContent: string = this.state.deleteMessage;
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
                {htmlContent}
            </div>
        </Modal>)
    }

    getPropertiesPanel() {
        return (
            <DrawerPanelContent onResize={width => this.setState({key: Math.random().toString(1)})}
                                style={{transform: "initial"}} isResizable hasNoBorder defaultSize={'400px'}
                                maxSize={'800px'} minSize={'300px'}>
                <DslProperties ref={this.state.ref}
                               integration={this.state.integration}
                               step={this.state.selectedStep}
                               onIntegrationUpdate={this.onIntegrationUpdate}
                               onPropertyUpdate={this.onPropertyUpdate}
                               clipboardStep={this.state.clipboardStep}
                               isRouteDesigner={true}
                               onSaveClipboardStep={this.saveToClipboard}
                />
            </DrawerPanelContent>
        )
    }

    getGraph() {
        const routes = CamelUi.getRoutes(this.state.integration);
        return (
            <div className="graph">
                <DslConnections height={this.state.height} width={this.state.width} top={this.state.top}
                                left={this.state.left} integration={this.state.integration}/>
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
                                    showTour={this.state.showTour}
                                    parent={undefined}/>
                    ))}
                    <div className="add-flow">
                        <Button
                            variant={routes.length === 0 ? "primary" : "secondary"}
                            data-click="ADD_ROUTE"
                            data-tour="add-route"
                            icon={<PlusIcon/>}
                            onClick={e => this.openSelector(undefined, undefined)}>Create new route
                        </Button>
                    </div>
                </div>
            </div>)
    }

    render() {
        return (
            <PageSection className="dsl-page" isFilled padding={{default: 'noPadding'}}>
                <div className="dsl-page-columns" data-tour="designer">
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
