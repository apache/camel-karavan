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
import '../karavan.css';
import {DslMetaModel} from "../utils/DslMetaModel";
import {CamelUtil} from "karavan-core/lib/api/CamelUtil";
import {ChoiceDefinition, FromDefinition, LogDefinition, RouteConfigurationDefinition, RouteDefinition} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {Command, EventBus} from "../utils/EventBus";
import {RouteToCreate} from "../utils/CamelUi";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import {toPng} from 'html-to-image';
import {RouteDesigner, RouteDesignerState} from "./RouteDesigner";
import {findDOMNode} from "react-dom";
import {Subscription} from "rxjs";

export class RouteDesignerLogic {

    routeDesigner: RouteDesigner
    commandSub?: Subscription

    constructor(routeDesigner: RouteDesigner) {
        this.routeDesigner = routeDesigner;
    }

    componentDidMount() {
        window.addEventListener('resize', this.routeDesigner.handleResize);
        window.addEventListener('keydown', this.routeDesigner.handleKeyDown);
        window.addEventListener('keyup', this.routeDesigner.handleKeyUp);
        const element = findDOMNode(this.routeDesigner.state.ref.current)?.parentElement?.parentElement;
        const checkResize = (mutations: any) => {
            const el = mutations[0].target;
            const w = el.clientWidth;
            const isChange = mutations.map((m: any) => `${m.oldValue}`).some((prev: any) => prev.indexOf(`width: ${w}px`) === -1);
            if (isChange) this.routeDesigner.setState({key: Math.random().toString()});
        }
        if (element) {
            const observer = new MutationObserver(checkResize);
            observer.observe(element, {attributes: true, attributeOldValue: true, attributeFilter: ['style']});
        }
        this.commandSub = EventBus.onCommand()?.subscribe((command: Command) => this.onCommand(command));
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.routeDesigner.handleResize);
        window.removeEventListener('keydown', this.routeDesigner.handleKeyDown);
        window.removeEventListener('keyup', this.routeDesigner.handleKeyUp);
        this.commandSub?.unsubscribe();
    }

    handleResize = (event: any) => {
        this.routeDesigner.setState({key: Math.random().toString()});
    }

    handleKeyDown = (event: KeyboardEvent) => {
        if ((event.shiftKey)) {
            this.routeDesigner.setState({shiftKeyPressed: true});
        }
        if (window.document.hasFocus() && window.document.activeElement) {
            if (['BODY', 'MAIN'].includes(window.document.activeElement.tagName)) {
                let charCode = String.fromCharCode(event.which).toLowerCase();
                if ((event.ctrlKey || event.metaKey) && charCode === 'c') {
                    this.copyToClipboard();
                } else if ((event.ctrlKey || event.metaKey) && charCode === 'v') {
                    this.pasteFromClipboard();
                }
            }
        } else {
            if (event.repeat) {
                window.dispatchEvent(event);
            }
        }
    }

    handleKeyUp = (event: KeyboardEvent) => {
        this.routeDesigner.setState({shiftKeyPressed: false});
        if (event.repeat) {
            window.dispatchEvent(event);
        }
    }

    componentDidUpdate = (prevState: Readonly<RouteDesignerState>, snapshot?: any) => {
        if (prevState.key !== this.routeDesigner.state.key) {
            this.routeDesigner.props.onSave?.call(this, this.routeDesigner.state.integration, this.routeDesigner.state.propertyOnly);
        }
    }

    copyToClipboard = (): void => {
        const {integration, selectedUuids} = this.routeDesigner.state;
        const steps: CamelElement[] = []
        selectedUuids.forEach(selectedUuid => {
            const selectedElement = CamelDefinitionApiExt.findElementInIntegration(integration, selectedUuid);
            if (selectedElement) {
                steps.push(selectedElement);
            }
        })
        if (steps.length >0) {
            this.routeDesigner.setState(prevState => ({
                key: Math.random().toString(),
                clipboardSteps: [...steps]
            }));
        }
    }
    pasteFromClipboard = (): void => {
        const {integration, selectedUuids, clipboardSteps} = this.routeDesigner.state;
        if (clipboardSteps.length === 1 && clipboardSteps[0]?.dslName === 'FromDefinition') {
            const clone = CamelUtil.cloneStep(clipboardSteps[0], true);
            const route = CamelDefinitionApi.createRouteDefinition({from: clone});
            this.addStep(route, '', 0)
        } else if (clipboardSteps.length === 1 && clipboardSteps[0]?.dslName === 'RouteDefinition') {
            const clone = CamelUtil.cloneStep(clipboardSteps[0], true);
            this.addStep(clone, '', 0)
        } else if (selectedUuids.length === 1) {
            const targetMeta = CamelDefinitionApiExt.findElementMetaInIntegration(integration, selectedUuids[0]);
            clipboardSteps.reverse().forEach(clipboardStep => {
                if (clipboardStep && targetMeta.parentUuid) {
                    const clone = CamelUtil.cloneStep(clipboardStep, true);
                    this.addStep(clone, targetMeta.parentUuid, targetMeta.position);
                }
            })
        }
    }

    onCommand = (command: Command) => {
        switch (command.command){
            case "downloadImage": this.integrationImageDownload()
        }
    }

    onPropertyUpdate = (element: CamelElement, newRoute?: RouteToCreate) => {
        if (newRoute) {
            let i = CamelDefinitionApiExt.updateIntegrationRouteElement(this.routeDesigner.state.integration, element);
            const f = CamelDefinitionApi.createFromDefinition({uri: newRoute.componentName + ":" + newRoute.name})
            const r = CamelDefinitionApi.createRouteDefinition({from: f, id: newRoute.name})
            i = CamelDefinitionApiExt.addStepToIntegration(i, r, '');
            const clone = CamelUtil.cloneIntegration(i);
            this.routeDesigner.setState(prevState => ({
                integration: clone,
                key: Math.random().toString(),
                showSelector: false,
                selectedStep: element,
                propertyOnly: false,
                selectedUuids: [element.uuid]
            }));
        } else {
            const clone = CamelUtil.cloneIntegration(this.routeDesigner.state.integration);
            const i = CamelDefinitionApiExt.updateIntegrationRouteElement(clone, element);
            this.routeDesigner.setState({integration: i, propertyOnly: true, key: Math.random().toString()});
        }
    }

    showDeleteConfirmation = (id: string) => {
        let message: string;
        const uuidsToDelete:string [] = [id];
        let ce: CamelElement;
        ce = CamelDefinitionApiExt.findElementInIntegration(this.routeDesigner.state.integration, id)!;
        if (ce.dslName === 'FromDefinition') { // Get the RouteDefinition for this.routeDesigner.  Use its uuid.
            let flows = this.routeDesigner.state.integration.spec.flows!;
            for (let i = 0; i < flows.length; i++) {
                if (flows[i].dslName === 'RouteDefinition') {
                    let routeDefinition: RouteDefinition = flows[i];
                    if (routeDefinition.from.uuid === id) {
                        uuidsToDelete.push(routeDefinition.uuid);
                        break;
                    }
                }
            }
            message = 'Deleting the first element will delete the entire route!';
        } else if (ce.dslName === 'RouteDefinition') {
            message = 'Delete route?';
        } else if (ce.dslName === 'RouteConfigurationDefinition') {
            message = 'Delete route configuration?';
        } else {
            message = 'Delete element from route?';
        }
        this.routeDesigner.setState(prevState => ({
            showSelector: false,
            showDeleteConfirmation: true,
            deleteMessage: message,
            selectedUuids: uuidsToDelete,
        }));
    }

    deleteElement = () => {
        this.routeDesigner.state.selectedUuids.forEach(uuidToDelete => {
            const i = CamelDefinitionApiExt.deleteStepFromIntegration(this.routeDesigner.state.integration, uuidToDelete);
            this.routeDesigner.setState(prevState => ({
                integration: i,
                showSelector: false,
                showDeleteConfirmation: false,
                deleteMessage: '',
                key: Math.random().toString(),
                selectedStep: undefined,
                propertyOnly: false,
                selectedUuids: [uuidToDelete],
            }));
            const el = new CamelElement("");
            el.uuid = uuidToDelete;
            EventBus.sendPosition("delete", el, undefined, new DOMRect(), new DOMRect(), 0);
        });
    }

    selectElement = (element: CamelElement) => {
        const {shiftKeyPressed, selectedUuids, integration} = this.routeDesigner.state;
        let canNotAdd: boolean = false;
        if (shiftKeyPressed) {
            const hasFrom = selectedUuids.map(e => CamelDefinitionApiExt.findElementInIntegration(integration, e)?.dslName === 'FromDefinition').filter(r => r).length > 0;
            canNotAdd = hasFrom || (selectedUuids.length > 0 && element.dslName === 'FromDefinition');
        }
        const add = shiftKeyPressed && !selectedUuids.includes(element.uuid);
        const remove = shiftKeyPressed && selectedUuids.includes(element.uuid);
        const i = CamelDisplayUtil.setIntegrationVisibility(this.routeDesigner.state.integration, element.uuid);
        this.routeDesigner.setState((prevState: RouteDesignerState) => {
            if (remove) {
                const index = prevState.selectedUuids.indexOf(element.uuid);
                prevState.selectedUuids.splice(index, 1);
            } else if (add && !canNotAdd) {
                prevState.selectedUuids.push(element.uuid);
            }
            const uuid: string = prevState.selectedUuids.includes(element.uuid) ? element.uuid : prevState.selectedUuids.at(0) || '';
            const selectedElement = shiftKeyPressed ? CamelDefinitionApiExt.findElementInIntegration(integration, uuid) : element;
            return {
                integration: i,
                selectedStep: selectedElement,
                showSelector: false,
                selectedUuids: shiftKeyPressed ? [...prevState.selectedUuids] : [element.uuid],
            }
        });
    }

    unselectElement = (evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if ((evt.target as any).dataset.click === 'FLOWS') {
            evt.stopPropagation()
            const i = CamelDisplayUtil.setIntegrationVisibility(this.routeDesigner.state.integration, undefined);
            this.routeDesigner.setState(prevState => ({
                integration: i,
                selectedStep: undefined,
                showSelector: false,
                selectedPosition: undefined,
                selectedUuids: [],
            }));
        }
    }

    openSelector = (parentId: string | undefined, parentDsl: string | undefined, showSteps: boolean = true, position?: number | undefined, selectorTabIndex?: string | number) => {
        this.routeDesigner.setState({
            showSelector: true,
            parentId: parentId || '',
            parentDsl: parentDsl,
            showSteps: showSteps,
            selectedPosition: position,
            selectorTabIndex: selectorTabIndex
        })
    }

    closeDslSelector = () => {
        this.routeDesigner.setState({showSelector: false})
    }

    onDslSelect = (dsl: DslMetaModel, parentId: string, position?: number | undefined) => {
        switch (dsl.dsl) {
            case 'FromDefinition' :
                const route = CamelDefinitionApi.createRouteDefinition({from: new FromDefinition({uri: dsl.uri})});
                this.addStep(route, parentId, position)
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
                const augmentedStep = this.setDslDefaults(step);
                this.addStep(augmentedStep, parentId, position)
                break;
        }
    }

    setDslDefaults(step: CamelElement): CamelElement {
        if (step.dslName === 'LogDefinition') {
            // eslint-disable-next-line no-template-curly-in-string
            (step as LogDefinition).message = "${body}";
        }
        if (step.dslName === 'ChoiceDefinition') {
            (step as ChoiceDefinition).when?.push(CamelDefinitionApi.createStep('WhenDefinition', undefined));
            (step as ChoiceDefinition).otherwise = CamelDefinitionApi.createStep('OtherwiseDefinition', undefined);
        }
        return step;
    }

    createRouteConfiguration = () => {
        const clone = CamelUtil.cloneIntegration(this.routeDesigner.state.integration);
        const routeConfiguration = new RouteConfigurationDefinition();
        const i = CamelDefinitionApiExt.addRouteConfigurationToIntegration(clone, routeConfiguration);
        this.routeDesigner.setState(prevState => ({
            integration: i,
            propertyOnly: false,
            key: Math.random().toString(),
            selectedStep: routeConfiguration,
            selectedUuids: [routeConfiguration.uuid],
        }));
    }

    addStep = (step: CamelElement, parentId: string, position?: number | undefined) => {
        const i = CamelDefinitionApiExt.addStepToIntegration(this.routeDesigner.state.integration, step, parentId, position);
        const clone = CamelUtil.cloneIntegration(i);
        EventBus.sendPosition("clean", step, undefined, new DOMRect(), new DOMRect(), 0);
        this.routeDesigner.setState(prevState => ({
            integration: clone,
            key: Math.random().toString(),
            showSelector: false,
            selectedStep: step,
            propertyOnly: false,
            selectedUuids: [step.uuid],
        }));
    }

    onIntegrationUpdate = (i: Integration) => {
        this.routeDesigner.setState({integration: i, propertyOnly: false, showSelector: false, key: Math.random().toString()});
    }

    moveElement = (source: string, target: string, asChild: boolean) => {
        const i = CamelDefinitionApiExt.moveRouteElement(this.routeDesigner.state.integration, source, target, asChild);
        const clone = CamelUtil.cloneIntegration(i);
        const selectedStep = CamelDefinitionApiExt.findElementInIntegration(clone, source);
        this.routeDesigner.setState(prevState => ({
            integration: clone,
            key: Math.random().toString(),
            showSelector: false,
            selectedStep: selectedStep,
            propertyOnly: false,
            selectedUuids: [source],
        }));
    }

    onResizePage(el: HTMLDivElement | null) {
        const rect = el?.getBoundingClientRect();
        if (el && rect && (el.scrollWidth !== this.routeDesigner.state.width || el.scrollHeight !== this.routeDesigner.state.height || rect.top !== this.routeDesigner.state.top || rect.left !== this.routeDesigner.state.left)) {
            this.routeDesigner.setState({width: el.scrollWidth, height: el.scrollHeight, top: rect.top, left: rect.left})
        }
    }

    downloadIntegrationImage(dataUrl: string) {
        const a = document.createElement('a');
        a.setAttribute('download', 'karavan-routes.png');
        a.setAttribute('href', dataUrl);
        a.click();
    }

    integrationImageDownloadFilter = (node: HTMLElement) => {
        const exclusionClasses = ['add-flow'];
        return !exclusionClasses.some(classname => {
            return node.classList === undefined ? false : node.classList.contains(classname);
        });
    }

    integrationImageDownload() {
        if (this.routeDesigner.state.printerRef.current === null) {
            return
        }
        toPng(this.routeDesigner.state.printerRef.current, {
            style: {overflow: 'hidden'}, cacheBust: true, filter: this.integrationImageDownloadFilter,
            height: this.routeDesigner.state.height, width: this.routeDesigner.state.width, backgroundColor: this.routeDesigner.props.dark ? "black" : "white"
        }).then(v => {
            toPng(this.routeDesigner.state.printerRef.current, {
                style: {overflow: 'hidden'}, cacheBust: true, filter: this.integrationImageDownloadFilter,
                height: this.routeDesigner.state.height, width: this.routeDesigner.state.width, backgroundColor: this.routeDesigner.props.dark ? "black" : "white"
            }).then(this.downloadIntegrationImage);
        })
    }
}