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
import {
    ChoiceDefinition,
    FromDefinition, GroovyExpression, JsonDataFormat,
    LogDefinition,
    MarshalDefinition,
    RouteConfigurationDefinition,
    RouteDefinition, SplitDefinition, UnmarshalDefinition
} from "karavan-core/lib/model/CamelDefinition";
import {CamelElement, MetadataLabels} from "karavan-core/lib/model/IntegrationDefinition";
import {CamelDefinitionApiExt} from "karavan-core/lib/api/CamelDefinitionApiExt";
import {CamelDefinitionApi} from "karavan-core/lib/api/CamelDefinitionApi";
import {Command, EventBus} from "../utils/EventBus";
import {CamelDisplayUtil} from "karavan-core/lib/api/CamelDisplayUtil";
import {toPng} from 'html-to-image';
import {useDesignerStore, useIntegrationStore, useSelectorStore} from "../DesignerStore";
import {shallow} from "zustand/shallow";
import {v4 as uuidv4} from 'uuid';

export function useRouteDesignerHook() {

    const [integration, setIntegration] = useIntegrationStore((state) => [state.integration, state.setIntegration], shallow)
    const [selectedUuids, clipboardSteps, shiftKeyPressed,
        setShowDeleteConfirmation, setDeleteMessage, selectedStep, setSelectedStep, setSelectedUuids, setClipboardSteps, setShiftKeyPressed,
        width, height, dark] = useDesignerStore((s) =>
        [s.selectedUuids, s.clipboardSteps, s.shiftKeyPressed,
            s.setShowDeleteConfirmation, s.setDeleteMessage, s.selectedStep, s.setSelectedStep, s.setSelectedUuids, s.setClipboardSteps, s.setShiftKeyPressed,
            s.width, s.height, s.dark], shallow)
    const [setParentId, setShowSelector, setSelectorTabIndex, setParentDsl, setShowSteps, setSelectedPosition, routeId, setRouteId] = useSelectorStore((s) =>
        [s.setParentId, s.setShowSelector, s.setSelectorTabIndex, s.setParentDsl, s.setShowSteps, s.setSelectedPosition, s.routeId, s.setRouteId], shallow)

    function onCommand(command: Command, printerRef: React.MutableRefObject<HTMLDivElement | null>) {
        switch (command.command) {
            case "downloadImage":
                integrationImageDownload(printerRef);
        }
    }

    function isKamelet(): boolean {
        return integration.type === 'kamelet';
    }

    function isSourceKamelet(): boolean {
        if (isKamelet()) {
            const m: MetadataLabels | undefined = integration.metadata.labels;
            return m !== undefined && m["camel.apache.org/kamelet.type"] === 'source';
        }
        return false;
    }

    function isSinkKamelet(): boolean {
        if (isKamelet()) {
            const m: MetadataLabels | undefined = integration.metadata.labels;
            return m !== undefined && m["camel.apache.org/kamelet.type"] === 'sink';
        }
        return false;
    }

    function isActionKamelet(): boolean {
        if (isKamelet()) {
            const m: MetadataLabels | undefined = integration.metadata.labels;
            return m !== undefined && m["camel.apache.org/kamelet.type"] === 'action';
        }
        return false;
    }

    const onShowDeleteConfirmation = (id: string) => {
        let message: string;
        const uuidsToDelete: string [] = [id];
        let ce: CamelElement;
        ce = CamelDefinitionApiExt.findElementInIntegration(integration, id)!;
        if (ce.dslName === 'FromDefinition') { // Get the RouteDefinition for this.routeDesigner.  Use its uuid.
            let flows = integration.spec.flows!;
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
        setShowDeleteConfirmation(true);
        setDeleteMessage(message);
        setSelectedUuids(uuidsToDelete);
    }

    const deleteElement = () => {
        EventBus.sendPosition("clean", new CamelElement(""), undefined, undefined, undefined, new DOMRect(), new DOMRect(), 0, 0);
        let i = integration;
        selectedUuids.forEach(uuidToDelete => {
            i = CamelDefinitionApiExt.deleteStepFromIntegration(i, uuidToDelete);
        });
        setIntegration(i, false);
        setShowSelector(false);
        setShowDeleteConfirmation(false);
        setDeleteMessage('');
        setSelectedStep(undefined);
        setSelectedUuids([]);
    }

    const selectElement = (element: CamelElement) => {
        const uuids = [...selectedUuids];
        let canNotAdd: boolean = false;
        if (shiftKeyPressed) {
            const hasFrom = uuids.map(e => CamelDefinitionApiExt.findElementInIntegration(integration, e)?.dslName === 'FromDefinition').filter(r => r).length > 0;
            canNotAdd = hasFrom || (uuids.length > 0 && element.dslName === 'FromDefinition');
        }
        const add = shiftKeyPressed && !uuids.includes(element.uuid);
        const remove = shiftKeyPressed && uuids.includes(element.uuid);
        // TODO: do we need to change Integration just for select????
        const i = CamelDisplayUtil.setIntegrationVisibility(integration, element.uuid);

        if (remove) {
            const index = uuids.indexOf(element.uuid);
            uuids.splice(index, 1);
        } else if (add && !canNotAdd) {
            uuids.push(element.uuid);
        }
        const uuid: string = uuids.includes(element.uuid) ? element.uuid : uuids.at(0) || '';
        const selectedElement = shiftKeyPressed ? CamelDefinitionApiExt.findElementInIntegration(integration, uuid) : element;

        setIntegration(i, true);
        setSelectedStep(selectedElement);
        setSelectedUuids(shiftKeyPressed ? [...uuids] : [element.uuid])
    }

    function handleKeyDown(event: KeyboardEvent) {
        if ((event.shiftKey)) {
            setShiftKeyPressed(true);
        }
        if (window.document.hasFocus() && window.document.activeElement) {
            if (['BODY', 'MAIN'].includes(window.document.activeElement.tagName)) {
                let charCode = String.fromCharCode(event.which).toLowerCase();
                if ((event.ctrlKey || event.metaKey) && charCode === 'c') {
                    copyToClipboard();
                } else if ((event.ctrlKey || event.metaKey) && charCode === 'v') {
                    pasteFromClipboard();
                }
            }
        } else {
            if (event.repeat) {
                window.dispatchEvent(event);
            }
        }
    }

    function handleKeyUp(event: KeyboardEvent) {
        setShiftKeyPressed(false);
        if (event.repeat) {
            window.dispatchEvent(event);
        }
    }

    function copyToClipboard(): void {
        const steps: CamelElement[] = []
        selectedUuids.forEach(selectedUuid => {
            const selectedElement = CamelDefinitionApiExt.findElementInIntegration(integration, selectedUuid);
            if (selectedElement) {
                steps.push(selectedElement);
            }
        })
        if (steps.length > 0) {
            setClipboardSteps(steps);
        }
    }

    function pasteFromClipboard(): void {
        if (clipboardSteps.length === 1 && clipboardSteps[0]?.dslName === 'FromDefinition') {
            const clone = CamelUtil.cloneStep(clipboardSteps[0], true);
            const route = CamelDefinitionApi.createRouteDefinition({from: clone});
            addStep(route, '', 0)
        } else if (clipboardSteps.length === 1 && clipboardSteps[0]?.dslName === 'RouteDefinition') {
            const clone = CamelUtil.cloneStep(clipboardSteps[0], true);
            addStep(clone, '', 0)
        } else if (selectedUuids.length === 1) {
            const targetMeta = CamelDefinitionApiExt.findElementMetaInIntegration(integration, selectedUuids[0]);
            clipboardSteps.reverse().forEach(clipboardStep => {
                if (clipboardStep && targetMeta.parentUuid) {
                    const clone = CamelUtil.cloneStep(clipboardStep, true);
                    addStep(clone, targetMeta.parentUuid, targetMeta.position);
                }
            })
        }
    }

    function unselectElement(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if ((evt.target as any).dataset.click === 'FLOWS') {
            evt.stopPropagation()
            const i = CamelDisplayUtil.setIntegrationVisibility(integration, undefined);
            setIntegration(i, true);
            setSelectedStep(undefined);
            setSelectedPosition(undefined);
            setSelectedUuids([]);
        }
    }

    const openSelector = (parentId: string | undefined, parentDsl: string | undefined, showSteps: boolean = true, position?: number | undefined) => {
        setShowSelector(true);
        setParentId(parentId || '');
        setParentDsl(parentDsl);
        setShowSteps(showSteps);
        setSelectedPosition(position);
        setSelectorTabIndex((parentId === undefined && parentDsl === undefined) ? 'components' : 'eip');
    }

    const openSelectorToReplaceFrom = (routeId: string) => {
        setShowSelector(true);
        setParentId('');
        setParentDsl(undefined);
        setShowSteps(true);
        setSelectedPosition(undefined);
        setRouteId(routeId);
        setSelectorTabIndex('components');
    }

    function onDslSelect(dsl: DslMetaModel, parentId: string, position?: number | undefined) {
        switch (dsl.dsl) {
            case 'FromDefinition' :
                if (routeId !== undefined) {
                    replaceFrom(dsl)
                } else {
                    const nodePrefixId = isKamelet() ? integration.metadata.name : 'route-' + uuidv4().substring(0, 3);
                    const route = CamelDefinitionApi.createRouteDefinition({
                        from: new FromDefinition({uri: dsl.uri}),
                        nodePrefixId: nodePrefixId
                    });
                    addStep(route, parentId, position)
                }
                break;
            case 'ToDefinition' :
                if (dsl.uri === undefined && isKamelet()) {
                    dsl.uri = 'kamelet:sink';
                }
                const to = CamelDefinitionApi.createStep(dsl.dsl, {uri: dsl.uri});
                addStep(to, parentId, position)
                break;
            case 'ToDynamicDefinition' :
                const toD = CamelDefinitionApi.createStep(dsl.dsl, {uri: dsl.uri});
                addStep(toD, parentId, position)
                break;
            case 'KameletDefinition' :
                const kamelet = CamelDefinitionApi.createStep(dsl.dsl, {name: dsl.name});
                addStep(kamelet, parentId, position)
                break;
            default:
                const step = CamelDefinitionApi.createStep(dsl.dsl, undefined);
                const augmentedStep = setDslDefaults(step);
                addStep(augmentedStep, parentId, position)
                break;
        }
    }

    function setDslDefaults(step: CamelElement): CamelElement {
        if (step.dslName === 'LogDefinition') {
            // eslint-disable-next-line no-template-curly-in-string
            (step as LogDefinition).message = "${body}";
        }
        if (step.dslName === 'SplitDefinition') {
            const split = (step as SplitDefinition);
            if (split.expression?.groovy !== undefined && (split.expression?.groovy as GroovyExpression).expression === "") {
                (split.expression?.groovy as GroovyExpression).expression = 'body';
            }
        }
        if (step.dslName === 'ChoiceDefinition') {
            (step as ChoiceDefinition).when?.push(CamelDefinitionApi.createStep('WhenDefinition', undefined));
            (step as ChoiceDefinition).otherwise = CamelDefinitionApi.createStep('OtherwiseDefinition', undefined);
        }
        if (step.dslName === 'MarshalDefinition') {
            if (CamelDefinitionApiExt.getDataFormat(step) === undefined) {
                (step as MarshalDefinition).json = new JsonDataFormat()
            }
        }
        if (step.dslName === 'UnmarshalDefinition') {
            if (CamelDefinitionApiExt.getDataFormat(step) === undefined) {
                (step as UnmarshalDefinition).json = new JsonDataFormat()
            }
        }
        return step;
    }

    const createRouteConfiguration = () => {
        const clone = CamelUtil.cloneIntegration(integration);
        const routeConfiguration = new RouteConfigurationDefinition();
        const i = CamelDefinitionApiExt.addRouteConfigurationToIntegration(clone, routeConfiguration);
        setIntegration(i, false);
        setSelectedStep(routeConfiguration);
        setSelectedUuids([routeConfiguration.uuid]);
    }

    const addStep = (step: CamelElement, parentId: string, position?: number | undefined) => {
        const clone = CamelUtil.cloneIntegration(integration);
        const i = CamelDefinitionApiExt.addStepToIntegration(clone, step, parentId, position);
        const selectedStep = step.dslName === 'RouteDefinition' ? (step as RouteDefinition).from : step;
        setIntegration(i, false);
        setSelectedStep(selectedStep);
        setSelectedUuids([selectedStep.uuid]);
    }

    const replaceFrom = (dsl: DslMetaModel) => {
        const fromId = (selectedStep as FromDefinition).id;
        if (selectedStep && fromId && dsl.uri) {
            const clone = CamelUtil.cloneIntegration(integration);
            const newFrom = CamelDefinitionApi.createFromDefinition({uri: dsl.uri})
            const i = CamelDefinitionApiExt.replaceFromInIntegration(clone, fromId, newFrom);
            setIntegration(i, false);
            setSelectedStep(newFrom);
            setSelectedUuids([newFrom.uuid]);
        }
    }

    const moveElement = (source: string, target: string, asChild: boolean) => {
        const i = CamelDefinitionApiExt.moveRouteElement(integration, source, target, asChild);
        const clone = CamelUtil.cloneIntegration(i);
        const selectedStep = CamelDefinitionApiExt.findElementInIntegration(clone, source);
        setIntegration(clone, false);
        setShowSelector(false);
        setSelectedStep(selectedStep);
        setSelectedUuids([source]);
    }

    function downloadIntegrationImage(dataUrl: string) {
        const a = document.createElement('a');
        a.setAttribute('download', 'karavan-routes.png');
        a.setAttribute('href', dataUrl);
        a.click();
    }

    function integrationImageDownloadFilter(node: HTMLElement) {
        const exclusionClasses = ['add-flow'];
        return !exclusionClasses.some(classname => {
            return node.classList === undefined ? false : node.classList.contains(classname);
        });
    }

    function integrationImageDownload(printerRef: React.MutableRefObject<HTMLDivElement | null>) {
        const ref = printerRef.current;
        if (ref !== null) {
            toPng(ref, {
                style: {overflow: 'hidden'}, cacheBust: true, filter: integrationImageDownloadFilter,
                height: height, width: width, backgroundColor: dark ? "black" : "white"
            }).then(v => {
                toPng(ref, {
                    style: {overflow: 'hidden'}, cacheBust: true, filter: integrationImageDownloadFilter,
                    height: height, width: width, backgroundColor: dark ? "black" : "white"
                }).then(downloadIntegrationImage);
            })
        }
    }

    return {
        deleteElement, selectElement, moveElement, onShowDeleteConfirmation, onDslSelect, openSelector,
        createRouteConfiguration, onCommand, handleKeyDown, handleKeyUp, unselectElement, isKamelet, isSourceKamelet,
        isActionKamelet, isSinkKamelet, openSelectorToReplaceFrom
    }
}