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

import {KaravanApi} from "@api/KaravanApi";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {ProjectFile} from "@models/ProjectModels";
import {useFilesStore, useProjectStore} from "@stores/ProjectStore";
import {createWithEqualityFn} from "zustand/traditional";

type Position = { x: number; y: number };
type ModelMap = Map<string, Position>;
export type LayoutManager = 'auto' | 'manual'
const SAVE_DEBOUNCE_MS = 500;

function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const debounced = (...args: Parameters<F>) => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), waitFor);
    };

    // Add a cancel method to the debounced function
    debounced.cancel = () => {
        if (timeout !== null) {
            clearTimeout(timeout);
        }
    };

    return debounced;
}

interface TopologyState {
    fileName?: string
    setFileName: (fileName?: string) => void
    modelMap: ModelMap;
    setModelMap: (modelMap: ModelMap) => Promise<void>;
    setNodePosition: (id: string, position: Position) => void;
    saveNow: () => void; // Expose a way to save immediately if needed
    showGroups: boolean
    setShowGroups: (showGroups: boolean) => void
    straightEdges: boolean
    setStraightEdges: (straightEdges: boolean) => void
    showBeans: boolean
    setShowBeans: (showBeans: boolean) => void
    showLegend: boolean
    setShowLegend: (showLegend: boolean) => void
    layout: LayoutManager
    setLayout: (layout: LayoutManager) => void
}

export const useTopologyStore = createWithEqualityFn<TopologyState>((set, get) => {

    const saveTopologyApi = (mapToSave: ModelMap): Promise<void> => {
        return new Promise((resolve, reject) => {
            const projectId = useProjectStore.getState().project.projectId;
            const files = useFilesStore.getState().files;
            let file = files.find(f => f.name === 'topology.json');

            const obj = Object.fromEntries(mapToSave.entries());
            const code = JSON.stringify(obj, null, 2);

            const onSuccess = (newFile: ProjectFile) => {
                // useFilesStore.getState().upsertFile(newFile);
                resolve();
            };

            const onError = (errorData: any) => {
                ErrorEventBus.sendApiError(errorData);
                reject(new Error("Failed to save topology file."));
            };

            if (file) {
                file.code = code;
                KaravanApi.putProjectFile(file, res => {
                    if (res.status === 200) onSuccess(res.data);
                    else onError(res?.data);
                });
            } else {
                const newFile = new ProjectFile('topology.json', projectId, code, Date.now());
                KaravanApi.saveProjectFile(newFile, (result, savedFile) => {
                    if (result) onSuccess(savedFile);
                    else onError(savedFile?.response?.data);
                });
            }
        });
    };

    const debouncedSave = debounce(() => {
        const currentMap = get().modelMap;
        if (currentMap.size > 0) {
            saveTopologyApi(currentMap);
        }
    }, SAVE_DEBOUNCE_MS);


    return {
        setFileName: (fileName?: string) => {
            set((state: TopologyState) => {
                return {fileName: fileName};
            });
        },
        modelMap: new Map<string, Position>(),
        setModelMap: async (newModelMap: ModelMap) => {
            set({ modelMap: newModelMap });
            try {
                if (get().layout === 'manual') {
                    await saveTopologyApi(newModelMap);
                }
            } catch (error) {
                // Optional: Handle error, e.g., show a notification or revert state
                console.error("Failed to save the new model map.", error);
            }
        },

        setNodePosition: (id: string, position: Position) => {
            // Update state immutably for predictable re-renders
            const newModelMap = new Map(get().modelMap);
            newModelMap.set(id, position);
            set({ modelMap: newModelMap });

            // Trigger the debounced save
            if (get().layout === 'manual') {
                debouncedSave();
            }
        },

        saveNow: () => {
            // You might want to cancel any pending debounced calls first if your debounce lib supports it.
            debouncedSave.cancel(); // Cancel any pending debounced save
            const currentMap = get().modelMap;
            if(currentMap.size > 0) {
                saveTopologyApi(currentMap);
            }
        },

        showGroups: false,
        setShowGroups: (showGroups: boolean) => {
            set({showGroups: showGroups});
        },
        straightEdges: true,
        setStraightEdges: (straightEdges: boolean) => {
            set((state: TopologyState) => {
                return {straightEdges: straightEdges};
            });
        },
        showBeans: false,
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
        layout: 'auto',
        setLayout: (layout: LayoutManager) => {
            set((state: TopologyState) => {
                return {layout: layout};
            });
        }
    }
});
