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

interface TopologyState {
    selectedIds: string []
    fileName?: string
    setSelectedIds: (selectedIds: string []) => void
    setFileName: (fileName?: string) => void
    ranker: string
    setRanker: (ranker: string) => void
    nodeData: any
    setNodeData: (nodeData: any) => void
    showGroups: boolean
    setShowGroups: (showGroups: boolean) => void
    showBeans: boolean
    setShowBeans: (showBeans: boolean) => void
    showLegend: boolean
    setShowLegend: (showLegend: boolean) => void
}

export const useTopologyStore = createWithEqualityFn<TopologyState>((set) => ({
    selectedIds: [],
    setSelectedIds: (selectedIds: string[]) => {
        set((state: TopologyState) => {
            return {selectedIds: selectedIds};
        });
    },
    setFileName: (fileName?: string) => {
        set((state: TopologyState) => {
            return {fileName: fileName};
        });
    },
    ranker: 'network-simplex',
    setRanker: (ranker: string) => {
        set((state: TopologyState) => {
            return {ranker: ranker};
        });
    },
    nodeData: undefined,
    setNodeData: (nodeData: any) => {
        set((state: TopologyState) => {
            return {nodeData: nodeData};
        });
    },
    showGroups: true,
    setShowGroups: (showGroups: boolean) => {
        set((state: TopologyState) => {
            return {showGroups: showGroups};
        });
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
}), shallow)
