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

import {CamelElement, Integration, IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {DslPosition, EventBus} from "./utils/EventBus";
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {BeanFactoryDefinition} from "karavan-core/lib/model/CamelDefinition";
import {DslMetaModel} from "@/designer/utils/DslMetaModel";

interface IntegrationState {
    integration: Integration;
    json: string;
    setIntegration: (integration: Integration, propertyOnly: boolean) => void;
    propertyOnly: boolean;
    reset: () => void;
    files: IntegrationFile []
    setFiles: (files: IntegrationFile []) => void
    resetFiles: (files: IntegrationFile []) => void
    variables: string[],
    setVariables: (variables: string[]) => void;
    key: string;
    setKey: (key: string) => void;
}

export const useIntegrationStore = createWithEqualityFn<IntegrationState>((set, get) => ({
    integration: Integration.createNew("demo", "plain"),
    propertyOnly: false,
    json: '{}',
    key: '',
    setIntegration: (integration: Integration, propertyOnly: boolean) => {
        set((state: IntegrationState) => {
            const json = JSON.stringify(integration);
            if (state.json === json) {
                return {integration: state.integration, propertyOnly: state.propertyOnly, json: state.json};
            } else {
                EventBus.sendIntegrationUpdate(integration, propertyOnly);
                return {integration: integration, propertyOnly: propertyOnly, json: json};
            }
        })
    },
    reset: () => {
        set({integration: Integration.createNew("demo", "plain"), json: '{}', propertyOnly: false});
    },
    files: [],
    setFiles: (files: IntegrationFile []) => {
        set((state: IntegrationState) => {
            return {files: files};
        });
    },
    resetFiles: (files: IntegrationFile []) => {
        set((state: IntegrationState) => {
            return {files: [...files]};
        });
    },
    variables: [],
    setVariables: (variables: string[]) => {
        set((state: IntegrationState) => {
            return {variables: [...variables]};
        })
    },
    setKey: (key: string) => {
        set({key: key});
    },
}), shallow)


interface SelectorStateState {
    showSelector: boolean;
    setShowSelector: (showSelector: boolean) => void;
    showProperties: boolean;
    setShowProperties: (showProperties: boolean) => void;
    selectedDsl?: DslMetaModel;
    setSelectedDsl: (selectedDsl?: DslMetaModel) => void;
    showSteps: boolean;
    setShowSteps: (showSteps: boolean) => void;
    parentDsl?: string;
    setParentDsl: (parentDsl?: string) => void;
    parentId: string;
    setParentId: (parentId: string) => void;
    selectorTabIndex?: string | number
    setSelectorTabIndex: (selectorTabIndex?: string | number) => void;
    selectedPosition?: number;
    setSelectedPosition: (selectedPosition?: number) => void;
    selectedToggles: string [];
    addSelectedToggle: (label: string) => void;
    deleteSelectedToggle: (label: string) => void;
    routeId?: string;
    setRouteId: (routeId: string) => void;
    isRouteTemplate?: boolean;
    setIsRouteTemplate: (isRouteTemplate: boolean) => void;
}

export const useSelectorStore = createWithEqualityFn<SelectorStateState>((set) => ({
    showSelector: false,
    showProperties: false,
    deleteMessage: '',
    parentId: '',
    showSteps: true,
    isRouteTemplate: false,
    selectedToggles: ['eip', 'components', 'kamelets'],
    addSelectedToggle: (toggle: string) => {
        set(state => ({
            selectedToggles: [...state.selectedToggles, toggle]
        }))
    },
    deleteSelectedToggle: (toggle: string) => {
        set(state => ({
            selectedToggles: [...state.selectedToggles.filter(x => x !== toggle)]
        }))
    },
    setSelectorTabIndex: (selectorTabIndex?: string | number) => {
        set({selectorTabIndex: selectorTabIndex})
    },
    setParentDsl: (parentDsl?: string) => {
        set({parentDsl: parentDsl})
    },
    setSelectedDsl: (selectedDsl?: DslMetaModel) => {
        set(state => ({
            selectedDsl: selectedDsl,
            showProperties: selectedDsl ? state.showProperties : false
        }))
    },
    setShowSelector: (showSelector: boolean) => {
        set({showSelector: showSelector})
    },
    setShowProperties: (showProperties: boolean) => {
        set({showProperties: showProperties})
    },
    setShowSteps: (showSteps: boolean) => {
        set({showSteps: showSteps})
    },
    setParentId: (parentId: string) => {
        set({parentId: parentId})
    },
    setSelectedPosition: (selectedPosition?: number) => {
        set({selectedPosition: selectedPosition})
    },
    setRouteId: (routeId: string) => {
        set({routeId: routeId})
    },
    setIsRouteTemplate: (isRouteTemplate: boolean) => {
        set({isRouteTemplate: isRouteTemplate})
    },
}), shallow)


interface ConnectionsState {
    steps: Map<string, DslPosition>;
    addStep: (uuid: string, position: DslPosition) => void;
    deleteStep: (uuid: string) => void;
    clearSteps: () => void;
    setSteps: (steps: Map<string, DslPosition>) => void;
}

export const useConnectionsStore = createWithEqualityFn<ConnectionsState>((set) => ({
    steps: new Map<string, DslPosition>(),
    addStep: (uuid: string, position: DslPosition) => {
        set(state => ({
            steps: new Map(state.steps).set(uuid, position),
        }))
    },
    deleteStep: (uuid: string) => {
        set((state: ConnectionsState) => {
            // state.steps.clear();
            Array.from(state.steps.entries())
                .filter(value => value[1]?.parent?.uuid !== uuid)
                .filter(value => value[1]?.prevStep?.uuid !== uuid)
                .filter(value => value[1]?.nextstep?.uuid !== uuid)
                .forEach(value => state.steps.set(value[0], value[1]));
            state.steps.delete(uuid)
            return state;
        })
    },
    clearSteps: () => {
        set((state: ConnectionsState) => {
            state.steps.clear();
            return state;
        })
    },
    setSteps: (steps: Map<string, DslPosition>) => {
        set({steps: steps})
    }
}), shallow)

type DesignerState = {
    designerSwitch: boolean
    isDebugging: boolean
    notificationBadge: boolean
    notificationMessage: [string, string]
    shiftKeyPressed: boolean
    showDeleteConfirmation: boolean
    showMoveConfirmation: boolean
    deleteMessage: string
    selectedStep?: CamelElement
    selectedUuids: string[]
    passedNodeIds: string[]
    passedRouteId?: string
    failedRouteId?: string
    suspendedNodeId?: string
    failed: boolean
    clipboardSteps: CamelElement[]
    width: number
    height: number
    top: number
    left: number
    moveElements: [string | undefined, string | undefined]
    propertyPlaceholders:  [string, string][]
    parameterPlaceholders: [string, string][], // route template parameters
    beans: BeanFactoryDefinition[],
    tab?: "routes" | "rest" | "beans" | "kamelet",
    stepDoubleClicked: boolean,
}

const designerState: DesignerState = {
    designerSwitch: true,
    isDebugging: false,
    notificationBadge: false,
    notificationMessage: ['', ''],
    shiftKeyPressed: false,
    showDeleteConfirmation: false,
    showMoveConfirmation: false,
    deleteMessage: '',
    selectedUuids: [],
    passedNodeIds: [],
    passedRouteId: undefined,
    failedRouteId: undefined,
    suspendedNodeId: undefined,
    failed: false,
    clipboardSteps: [],
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    moveElements: [undefined, undefined],
    propertyPlaceholders: [],
    parameterPlaceholders: [],
    beans: [],
    stepDoubleClicked: false,
};

type DesignerAction = {
    setDebugging: (isDebugging: boolean) => void;
    setShiftKeyPressed: (shiftKeyPressed: boolean) => void;
    setShowDeleteConfirmation: (showDeleteConfirmation: boolean) => void;
    setShowMoveConfirmation: (showMoveConfirmation: boolean) => void;
    setDeleteMessage: (deleteMessage: string) => void;
    setSelectedStep: (selectedStep?: CamelElement) => void;
    setSelectedUuids: (selectedUuids: string[]) => void;
    setPassedNodeIds: (passedNodeIds: string[]) => void;
    setPassedRouteId: (passedRouteId?: string) => void;
    setFailedRouteId: (failedRouteId?: string) => void;
    setSuspendedNodeId: (suspendedNodeId?: string) => void;
    setFailed: (failed: boolean) => void;
    setClipboardSteps: (clipboardSteps: CamelElement[]) => void;
    setPosition: (width: number, height: number, top: number, left: number) => void;
    reset: () => void;
    setNotification: (notificationBadge: boolean, notificationMessage: [string, string]) => void;
    setMoveElements: (moveElements: [string | undefined, string | undefined]) => void;
    setPropertyPlaceholders: (propertyPlaceholders:  [string, string][]) => void;
    setParameterPlaceholders: (parameterPlaceholders: [string, string][]) => void;
    setBeans: (beans: BeanFactoryDefinition[]) => void;
    setTab: (tab?: "routes" | "rest" | "beans" | "kamelet") => void;
    setDesignerSwitch: (designerSwitch: boolean) => void;
    setStepDoubleClicked: (stepDoubleClicked: boolean) => void;
}

export const useDesignerStore = createWithEqualityFn<DesignerState & DesignerAction>((set) => ({
    ...designerState,
    setDebugging: (isDebugging: boolean) => {
        set({isDebugging: isDebugging})
    },
    setFailed: (failed: boolean) => {
        set({failed: failed})
    },
    setShiftKeyPressed: (shiftKeyPressed: boolean) => {
        set({shiftKeyPressed: shiftKeyPressed})
    },
    setSelectedStep: (selectedStep?: CamelElement) => {
        set({selectedStep: selectedStep})
    },
    setShowDeleteConfirmation: (showDeleteConfirmation: boolean) => {
        set({showDeleteConfirmation: showDeleteConfirmation})
    },
    setShowMoveConfirmation: (showMoveConfirmation: boolean) => {
        set({showMoveConfirmation: showMoveConfirmation})
    },
    setDeleteMessage: (deleteMessage: string) => {
        set({deleteMessage: deleteMessage})
    },
    setSelectedUuids: (selectedUuids: string[]) => {
        set((state: DesignerState) => {
            state.selectedUuids.length = 0;
            state.selectedUuids.push(...selectedUuids);
            return state;
        })
    },
    setPassedNodeIds: (passedNodeIds: string[]) => {
        set((state: DesignerState) => {
            state.passedNodeIds.length = 0;
            state.passedNodeIds.push(...passedNodeIds);
            return state;
        })
    },
    setPassedRouteId: (passedRouteId?: string) => {
        set({passedRouteId: passedRouteId})
    },
    setFailedRouteId: (failedRouteId?: string) => {
        set({failedRouteId: failedRouteId})
    },
    setSuspendedNodeId: (suspendedNodeId?: string) => {
        set({suspendedNodeId: suspendedNodeId})
    },
    setClipboardSteps: (clipboardSteps: CamelElement[]) => {
        set((state: DesignerState) => {
            state.clipboardSteps.length = 0;
            state.clipboardSteps.push(...clipboardSteps);
            return state;
        })
    },
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    setPosition: (width: number, height: number, top: number, left: number) => {
        set({width: width, height: height, top: top, left: left})
    },
    reset: () => {
        set(state => {
            designerState.designerSwitch = state.designerSwitch;
            return designerState;
        });
    },
    setNotification: (notificationBadge: boolean, notificationMessage: [string, string]) => {
        set({notificationBadge: notificationBadge, notificationMessage: notificationMessage})
    },
    setMoveElements: (moveElements: [string | undefined, string | undefined]) => {
        set({moveElements: moveElements})
    },
    setPropertyPlaceholders: (propertyPlaceholders:  [string, string][]) => {
        set((state: DesignerState) => {
            state.propertyPlaceholders.length = 0;
            state.propertyPlaceholders.push(...propertyPlaceholders);
            return state;
        })
    },
    setParameterPlaceholders: (parameterPlaceholders: [string, string][]) => {
        set((state: DesignerState) => {
            state.parameterPlaceholders.length = 0;
            state.parameterPlaceholders.push(...parameterPlaceholders);
            return state;
        })
    },
    setBeans: (beans: BeanFactoryDefinition[]) => {
        set((state: DesignerState) => {
            return {beans: [...beans]};
        })
    },
    setTab: (tab?: "routes" | "rest" | "beans" | "kamelet")  => {
        set({tab: tab})
    },
    setDesignerSwitch: (designerSwitch: boolean) => {
        set({designerSwitch: designerSwitch})
    },
    setStepDoubleClicked: (stepDoubleClicked: boolean) => {
        set({stepDoubleClicked: stepDoubleClicked})
    },
}), shallow)
