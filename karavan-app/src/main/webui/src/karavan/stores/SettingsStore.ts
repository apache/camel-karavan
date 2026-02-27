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
import {ProjectFile, ProjectType} from "@models/ProjectModels";
import {create} from "zustand";
import {KaravanApi} from "@api/KaravanApi";
import isEqual from "lodash/isEqual";
import concat from "lodash/concat";

export const SettingsMenus = ['templates', 'kamelets', 'configuration'] as const;
export type SettingsMenu = typeof SettingsMenus[number];

type SettingsState = {
    currentMenu: SettingsMenu;
    setCurrentMenu: (currentMenu: SettingsMenu) => void;
    selectedProjectId?: string;
    setSelectedProjectId: (selectedProjectId?: string) => void;
    selectedFileName?: string;
    setSelectedFilename: (selectedFileName?: string) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    currentMenu: SettingsMenus[0],
    setCurrentMenu: (currentMenu: SettingsMenu) => {
        set({ currentMenu: currentMenu });
    },
    setSelectedProjectId: (selectedProjectId: string) => {
        set({ selectedProjectId: selectedProjectId });
    },
    setSelectedFilename: (selectedFileName: string) => {
        set({ selectedFileName: selectedFileName });
    },
}))

type TemplatesState = {
    templateFiles: ProjectFile[];
    saveTemplateFile: (file: ProjectFile) => Promise<void>;
    fetchTemplateFiles: () => Promise<void>;
}

export const useTemplatesStore = create<TemplatesState>((set, get) => ({
    templateFiles: [],
    fetchTemplateFiles: async (): Promise<void> => {
        await new Promise<ProjectFile[]>((resolve) => {
            KaravanApi.getFiles(ProjectType.templates, resolve);
        }).then(templates => {
            const currentTemplateFiles = get().templateFiles;
            if (!isEqual(currentTemplateFiles, templates)) {
                set({ templateFiles: templates });
            }
        })
    },
    saveTemplateFile: async (file: ProjectFile) => {
        const prevSettings = [...get().templateFiles];
        const newTemplateFiles = concat(prevSettings.filter(f => f.name !== file.name), file)
        set({ templateFiles: newTemplateFiles });

        await new Promise<{ result: boolean; file: ProjectFile | any }>((resolve, reject) => {
            KaravanApi.saveProjectFile(file, (result, file) => {
                if (result) {
                    resolve({ result, file });
                } else {
                    // Reject the promise if the API explicitly returns result: false (Application error)
                    reject(new Error("API returned failure result."));
                }
            });
        }).catch(error => {
            set({ templateFiles: prevSettings });
            console.error(error);
        });
    }
}))



