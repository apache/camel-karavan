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

interface PropertiesState {
    propertyFilter: string;
    setPropertyFilter: (propertyFilter: string) => void
    requiredOnly: boolean;
    setRequiredOnly: (requiredOnly: boolean) => void
    changedOnly: boolean;
    setChangedOnly: (changedOnly: boolean) => void
    sensitiveOnly: boolean;
    setSensitiveOnly: (sensitiveOnly: boolean) => void
}

export const usePropertiesStore = createWithEqualityFn<PropertiesState>((set, get) => ({
    requiredOnly: false,
    changedOnly: false,
    sensitiveOnly: false,
    propertyFilter: '',
    setPropertyFilter: (propertyFilter: string) => {
        set({propertyFilter: propertyFilter});
    },
    setRequiredOnly: (requiredOnly: boolean) => {
        set({requiredOnly: requiredOnly});
    },
    setChangedOnly: (changedOnly: boolean) => {
        set({changedOnly: changedOnly});
    },
    setSensitiveOnly: (sensitiveOnly: boolean) => {
        set({sensitiveOnly: sensitiveOnly});
    },
}), shallow)
