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
import {create} from "zustand";
import {KaravanApi} from "@api/KaravanApi";
import {ProjectFile, ProjectType} from "@models/ProjectModels";

interface UIState {
    pageId?: string;
    setPageId: (pageId?: string) => void;
    customLogo?: string;
    customName?: string;
    fetchBrand: () => Promise<void>;
}

export const useUIStore = create<UIState>((set, get) => ({
    pageId: undefined,
    setPageId: (pageId?: string) => set({pageId: pageId}),
    customLogo: undefined,
    fetchBrand: async (): Promise<void> => {
        const logoP = new Promise<ProjectFile>((resolve) => {
            KaravanApi.getProjectFilesByName(ProjectType.configuration, 'logo.svg', resolve)
        });

        const nameP = new Promise<ProjectFile>((resolve) => {
            KaravanApi.getProjectFilesByName(ProjectType.configuration, 'name.svg', resolve)
        });

        // Wait for BOTH API calls
        const [logo, name] = await Promise.all([logoP, nameP]);
        set({customLogo: logo?.code, customName: name?.code});
    }
}))