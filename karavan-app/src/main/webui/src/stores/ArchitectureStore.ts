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
import {ModalConfirmationProps} from "@shared/ui/ModalConfirmation";
import {BeanUsageData, ExchangeData, ExchangeMessage} from "@core/model/ExchangeDefinitions";

export type ArchitectureLayout = 'dagre' | 'elk' | 'force';

const STORAGE_KEY_ARCHITECTURE_LAYOUT = "architecture-layout";
const STORAGE_KEY_ARCHITECTURE_SHOW_GROUPS = "architecture-show-groups";
const STORAGE_KEY_ARCHITECTURE_SHOW_TEMPLATES = "architecture-show-templates";

function getInitialLayout(): ArchitectureLayout {
    if (typeof window === "undefined") return "elk"; // SSR safety
    const saved = localStorage.getItem(STORAGE_KEY_ARCHITECTURE_LAYOUT) as ArchitectureLayout | null;
    return saved ?? "elk";
}

function getInitialShowGroups(): boolean {
    if (typeof window === "undefined") return false; // SSR safety
    const saved = localStorage.getItem(STORAGE_KEY_ARCHITECTURE_SHOW_GROUPS);
    if (saved === null) return false;
    return saved === "true";
}
function getInitialShowTemplates(): boolean {
    if (typeof window === "undefined") return false; // SSR safety
    const saved = localStorage.getItem(STORAGE_KEY_ARCHITECTURE_SHOW_TEMPLATES);
    if (saved === null) return false;
    return saved === "true";
}

interface ArchitectureState {
    fileName?: string
    setFileName: (fileName?: string) => void
    showGroups: boolean
    setShowGroups: (showGroups: boolean) => void
    showLegend: boolean
    setShowLegend: (showLegend: boolean) => void
    showStats: boolean
    setShowStats: (showStats: boolean) => void
    layout: ArchitectureLayout
    setLayout: (layout: ArchitectureLayout) => void
    nextLayout: () => void
    showRouteTemplates?: boolean
    setShowRouteTemplates: (showRouteTemplates: boolean) => void
    confirmationProps?: ModalConfirmationProps
    setConfirmationProps: (confirmationProps?: ModalConfirmationProps) => void
    selectedNodes: string[]
    setSelectedNodes: (selectedNodes: string[]) => void
    connectedToSelectedNodes: string[]
    setConnectedSelectedNodes: (connectedToSelectedNodes: string[]) => void
    exchangeMessage?: ExchangeMessage
    setExchangeMessage: (exchangeMessage: ExchangeMessage) => void
    selectedVariable?: ExchangeData
    setSelectedVariable: (selectedVariable: ExchangeData) => void
    selectedBean?: BeanUsageData
    setSelectedBean: (selectedBean: BeanUsageData) => void
}

export const useArchitectureStore = createWithEqualityFn<ArchitectureState>((set, get) => {
    return {
        setFileName: (fileName?: string) => {
            set((state: ArchitectureState) => {
                return {fileName: fileName};
            });
        },
        showGroups: getInitialShowGroups(),
        setShowGroups: (showGroups: boolean) => {
            localStorage.setItem(STORAGE_KEY_ARCHITECTURE_SHOW_GROUPS, String(showGroups));
            set({showGroups: showGroups});
        },
        showLegend: false,
        setShowLegend: (showLegend: boolean) => {
            set((state: ArchitectureState) => {
                return {showLegend: showLegend};
            });
        },
        showStats: false,
        setShowStats: (showStats: boolean) => {
            set((state: ArchitectureState) => {
                return {showStats: showStats};
            });
        },
        layout: getInitialLayout(),
        setLayout: (layout: ArchitectureLayout) => {
            localStorage.setItem(STORAGE_KEY_ARCHITECTURE_LAYOUT, layout);
            set({ layout });
        },
        nextLayout: () => {
            const currentLayout = get().layout;
            let nextLayout: ArchitectureLayout = 'dagre';
            if (currentLayout === 'dagre') {
                nextLayout = 'elk';
            } else if (currentLayout === 'elk') {
                nextLayout = 'force';
            } else {
                nextLayout = 'dagre';
            }
            localStorage.setItem(STORAGE_KEY_ARCHITECTURE_LAYOUT, nextLayout);
            set({ layout: nextLayout });
        },
        showRouteTemplates: getInitialShowTemplates(),
        setShowRouteTemplates: (showRouteTemplates: boolean) => {
            localStorage.setItem(STORAGE_KEY_ARCHITECTURE_SHOW_TEMPLATES, String(showRouteTemplates));
            set({ showRouteTemplates: showRouteTemplates });
        },
        setConfirmationProps: (confirmationProps?: ModalConfirmationProps) => {
            set({ confirmationProps });
        },
        selectedNodes: [],
        setSelectedNodes: (selectedNodes: string[]) => {
            set({ selectedNodes });
        },
        connectedToSelectedNodes: [],
        setConnectedSelectedNodes: (connectedToSelectedNodes: string[]) => {
            set({ connectedToSelectedNodes });
        },
        setExchangeMessage: (exchangeMessage: ExchangeMessage) => {
            set({ exchangeMessage });
        },
        setSelectedVariable: (selectedVariable: ExchangeData) => {
            set({ selectedVariable });
        },
        setSelectedBean: (selectedBean: BeanUsageData) => {
            set({ selectedBean });
        }
    }
});
