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

import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {DslMetaModel} from "@designer/utils/DslMetaModel";

interface CommandPaletteState {
    fileName: string;
    showPalette: boolean;
    showProperties: boolean;
    showSteps: boolean;
    parentDsl?: string;
    parentId: string;
    selectorTabIndex?: string | number
    selectedPosition?: number;
    routeId?: string;
    filter: string;
    isRouteTemplate?: boolean;
    selectedDsl?: DslMetaModel;
    elements: DslMetaModel[];

    setFileName: (fileName: string) => void;
    setShowPalette: (showPalette: boolean) => void;
    setShowProperties: (showProperties: boolean) => void;
    setSelectedDsl: (selectedDsl?: DslMetaModel) => void;
    setShowSteps: (showSteps: boolean) => void;
    setParentDsl: (parentDsl?: string) => void;
    setParentId: (parentId: string) => void;
    setSelectorTabIndex: (selectorTabIndex?: string | number) => void;
    setSelectedPosition: (selectedPosition?: number) => void;
    setRouteId: (routeId: string) => void;
    setIsRouteTemplate: (isRouteTemplate: boolean) => void;
    setFilter: (filter: string) => void;
    setElements: (elements: DslMetaModel[]) => void;
}

export const useCommandPaletteStore = createWithEqualityFn<CommandPaletteState>((set) => ({
    showPalette: false,
    showProperties: false,
    deleteMessage: '',
    parentId: '',
    showSteps: true,
    isRouteTemplate: false,
    filter: '',
    elements: [],
    fileName: undefined,
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
    setShowPalette: (showPalette: boolean) => {
        set({showPalette: showPalette})
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
    setFilter: (filter: string) => {
        set({ filter: filter })
    },
    setElements: (elements: DslMetaModel[])  => {
        set({ elements: elements })
    },
    setFileName: (fileName: string) => {
        set({ fileName: fileName })
    },
}), shallow)
