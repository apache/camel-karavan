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

import {CamelElement, Integration} from "karavan-core/lib/model/IntegrationDefinition";
import {DslPosition, EventBus} from "./utils/EventBus";
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

interface IntegrationState {
    integration: Integration;
    json: string;
    setIntegration: (integration: Integration, propertyOnly: boolean) => void;
    propertyOnly: boolean;
    reset: () => void;
}

export const useIntegrationStore = createWithEqualityFn<IntegrationState>((set) => ({
    integration: Integration.createNew("demo", "plain"),
    propertyOnly: false,
    json: '{}',
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
    }
}), shallow)


interface SelectorStateState {
    showSelector: boolean;
    setShowSelector: (showSelector: boolean) => void;
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
    selectedLabels: string [];
    addSelectedLabel: (label: string) => void;
    deleteSelectedLabel: (label: string) => void;
    clearSelectedLabels: () => void;
}

export const useSelectorStore = createWithEqualityFn<SelectorStateState>((set) => ({
    showSelector: false,
    deleteMessage: '',
    parentId: '',
    showSteps: true,
    selectedLabels: [],
    addSelectedLabel: (label: string) => {
        set(state => ({
            selectedLabels: [...state.selectedLabels, label]
        }))
    },
    deleteSelectedLabel: (label: string) => {
        set(state => ({
            selectedLabels: [...state.selectedLabels.filter(x => x !== label)]
        }))
    },
    clearSelectedLabels: () => {
        set((state: SelectorStateState) => {
            state.selectedLabels.length = 0;
            return state;
        })
    },
    setSelectedLabels: (selectedLabels: string []) => {
        set({selectedLabels: selectedLabels})
    },
    setSelectorTabIndex: (selectorTabIndex?: string | number) => {
        set({selectorTabIndex: selectorTabIndex})
    },
    setParentDsl: (parentDsl?: string) => {
        set({parentDsl: parentDsl})
    },
    setShowSelector: (showSelector: boolean) => {
        set({showSelector: showSelector})
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
    dark: boolean;
    notificationBadge: boolean;
    notificationMessage: [string, string];
    hideLogDSL: boolean;
    shiftKeyPressed: boolean;
    showDeleteConfirmation: boolean;
    showMoveConfirmation: boolean;
    deleteMessage: string;
    selectedStep?: CamelElement;
    selectedUuids: string[];
    clipboardSteps: CamelElement[];
    width: number,
    height: number,
    top: number,
    left: number,
    moveElements: [string | undefined, string | undefined],
    propertyPlaceholders: string[];
}

const designerState: DesignerState = {
    notificationBadge: false,
    notificationMessage: ['', ''],
    dark: false,
    hideLogDSL: false,
    shiftKeyPressed: false,
    showDeleteConfirmation: false,
    showMoveConfirmation: false,
    deleteMessage: '',
    selectedUuids: [],
    clipboardSteps: [],
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    moveElements: [undefined, undefined],
    propertyPlaceholders: []
};

type DesignerAction = {
    setDark: (dark: boolean) => void;
    setHideLogDSL: (hideLogDSL: boolean) => void;
    setShiftKeyPressed: (shiftKeyPressed: boolean) => void;
    setShowDeleteConfirmation: (showDeleteConfirmation: boolean) => void;
    setShowMoveConfirmation: (showMoveConfirmation: boolean) => void;
    setDeleteMessage: (deleteMessage: string) => void;
    setSelectedStep: (selectedStep?: CamelElement) => void;
    setSelectedUuids: (selectedUuids: string[]) => void;
    setClipboardSteps: (clipboardSteps: CamelElement[]) => void;
    setPosition: (width: number, height: number, top: number, left: number) => void;
    reset: () => void;
    setNotification: (notificationBadge: boolean, notificationMessage: [string, string]) => void;
    setMoveElements: (moveElements: [string | undefined, string | undefined]) => void;
    setPropertyPlaceholders: (propertyPlaceholders: string[]) => void;
}

export const useDesignerStore = createWithEqualityFn<DesignerState & DesignerAction>((set) => ({
    ...designerState,
    setDark: (dark: boolean) => {
        set({dark: dark})
    },
    setHideLogDSL: (hideLogDSL: boolean) => {
        set({hideLogDSL: hideLogDSL})
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
        set(designerState);
    },
    setNotification: (notificationBadge: boolean, notificationMessage: [string, string]) => {
        set({notificationBadge: notificationBadge, notificationMessage: notificationMessage})
    },
    setMoveElements: (moveElements: [string | undefined, string | undefined]) => {
        set({moveElements: moveElements})
    },
    setPropertyPlaceholders: (propertyPlaceholders: string[]) => {
        set((state: DesignerState) => {
            state.propertyPlaceholders.length = 0;
            state.propertyPlaceholders.push(...propertyPlaceholders);
            return state;
        })
    },
}), shallow)