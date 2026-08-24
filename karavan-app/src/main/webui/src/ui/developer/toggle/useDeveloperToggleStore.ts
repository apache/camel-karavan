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

export const DeveloperToggleOptions = ["designer", "code", "diff", "preview"] as const;
export type DeveloperToggleOption = typeof DeveloperToggleOptions[number];


interface DeveloperToggleState {
    developerView: DeveloperToggleOption,

    // Actions
    setDeveloperView: (developerView: DeveloperToggleOption) => void;
}

export const useDeveloperToggleStore = createWithEqualityFn<DeveloperToggleState>((set, get) => ({
    developerView: DeveloperToggleOptions[0],

    setDeveloperView: (developerView: DeveloperToggleOption) => {
        set({developerView: developerView});
    }
}), shallow);
