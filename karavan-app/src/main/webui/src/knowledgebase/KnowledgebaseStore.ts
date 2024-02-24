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
import {Component} from "karavan-core/lib/model/ComponentModels";
import {ElementMeta} from "karavan-core/lib/model/CamelMetadata";
import {KameletModel} from "karavan-core/lib/model/KameletModels";

interface KnowledgebaseState {
    isModalOpen: boolean;
    setModalOpen: (isModalOpen: boolean) => void;
    showBlockCheckbox: boolean;
    setShowBlockCheckbox: (showBlockCheckbox: boolean) => void;
    component?: Component;
    setComponent: (component: Component) => void;
    element?: ElementMeta;
    setElement: (element: ElementMeta) => void;
    kamelet?: KameletModel;
    setKamelet: (kamelet: KameletModel) => void;
}

export const useKnowledgebaseStore = createWithEqualityFn<KnowledgebaseState>((set) => ({
    isModalOpen: false,
    setModalOpen: (isModalOpen: boolean) => {
        set((state: KnowledgebaseState) => {
            return {isModalOpen: isModalOpen};
        })
    },
    showBlockCheckbox: false,
    setShowBlockCheckbox: (showBlockCheckbox: boolean) => {
        set((state: KnowledgebaseState) => {
            return {showBlockCheckbox: showBlockCheckbox};
        })
    },
    setComponent: (component: Component) => {
        set((state: KnowledgebaseState) => {
            return {component: component};
        })
    },
    setElement: (element: ElementMeta) => {
        set((state: KnowledgebaseState) => {
            return {element: element};
        })
    },
    setKamelet: (kamelet: KameletModel) => {
        set((state: KnowledgebaseState) => {
            return {kamelet: kamelet};
        })
    }
}), shallow)