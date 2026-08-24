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
import React from "react";
import {shallow} from "zustand/shallow";
import {createWithEqualityFn} from "zustand/traditional";

interface CompassState {
    isDockExpanded: boolean;
    isDockTextExpanded: boolean;
    isDrawerExpanded: boolean;

    // Add state to hold the injected panel headers
    pageTitle: React.ReactNode;
    pageNav: React.ReactNode;
    pageTools: React.ReactNode;
    drawerPanel: React.ReactNode;

    setIsDockExpanded: (isDockExpanded: boolean) => void;
    setIsDockTextExpanded: (isDockTextExpanded: boolean) => void;
    setIsDrawerExpanded: (isDrawerExpanded: boolean) => void;

    // Action to set the context from RightPanel
    setPageContext: (title: React.ReactNode, nav: React.ReactNode, tools: React.ReactNode, drawerPanel: React.ReactNode) => void;
    setDrawerPanel: (drawerPanel: React.ReactNode) => void;
}

export const useCompassStore = createWithEqualityFn<CompassState>((set, get) => ({
    // Initial State
    isDockExpanded: false,
    isDockTextExpanded: false,
    isDrawerExpanded: false,

    pageTitle: null,
    pageNav: null,
    pageTools: null,
    drawerPanel: null,

    // Actions
    setIsDockExpanded: (isDockExpanded) => set({ isDockExpanded }),
    setIsDockTextExpanded: (isDockTextExpanded) => set({ isDockTextExpanded }),
    setIsDrawerExpanded: (isDrawerExpanded) => set({ isDrawerExpanded }),

    setPageContext: (pageTitle, pageNav, pageTools, drawerPanel) => set({ pageTitle, pageNav, pageTools, drawerPanel }),
    setDrawerPanel: (drawerPanel) => set({ drawerPanel }),
}), shallow);