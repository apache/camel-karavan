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

export type TopologyLayout = 'dagre' | 'elk';

const STORAGE_KEY_TOPOLOGY_LAYOUT = "topology-layout";
const STORAGE_KEY_TOPOLOGY_SHOW_GROUPS = "topology-show-groups";

function getInitialLayout(): TopologyLayout {
    if (typeof window === "undefined") return "elk"; // SSR safety
    const saved = localStorage.getItem(STORAGE_KEY_TOPOLOGY_LAYOUT) as TopologyLayout | null;
    return saved ?? "elk";
}

function getInitialShowGroups(): boolean {
    if (typeof window === "undefined") return false; // SSR safety
    const saved = localStorage.getItem(STORAGE_KEY_TOPOLOGY_SHOW_GROUPS);
    if (saved === null) return false;
    return saved === "true";
}

interface TopologyState {
    fileName?: string
    setFileName: (fileName?: string) => void
    showGroups: boolean
    setShowGroups: (showGroups: boolean) => void
    showBeans: boolean
    setShowBeans: (showBeans: boolean) => void
    showLegend: boolean
    setShowLegend: (showLegend: boolean) => void
    showStats: boolean
    setShowStats: (showStats: boolean) => void
    layout: TopologyLayout
    setLayout: (layout: TopologyLayout) => void
}

export const useTopologyStore = createWithEqualityFn<TopologyState>((set, get) => {
    return {
        setFileName: (fileName?: string) => {
            set((state: TopologyState) => {
                return {fileName: fileName};
            });
        },
        showGroups: getInitialShowGroups(),
        setShowGroups: (showGroups: boolean) => {
            localStorage.setItem(STORAGE_KEY_TOPOLOGY_SHOW_GROUPS, String(showGroups));
            set({showGroups: showGroups});
        },
        showBeans: true,
        setShowBeans: (showBeans: boolean) => {
            set((state: TopologyState) => {
                return {showBeans: showBeans};
            });
        },
        showLegend: false,
        setShowLegend: (showLegend: boolean) => {
            set((state: TopologyState) => {
                return {showLegend: showLegend};
            });
        },
        showStats: false,
        setShowStats: (showStats: boolean) => {
            set((state: TopologyState) => {
                return {showStats: showStats};
            });
        },
        layout: getInitialLayout(),
        setLayout: (layout: TopologyLayout) => {
            localStorage.setItem(STORAGE_KEY_TOPOLOGY_LAYOUT, layout);
            set({ layout });
        },
    }
});
