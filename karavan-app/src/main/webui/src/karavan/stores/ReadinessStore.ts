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
import isEqual from 'lodash/isEqual';
import {KaravanApi} from "@api/KaravanApi";
import {create} from "zustand";

type ReadinessState = {
    readiness: any;
    fetchReadiness: () => Promise<void>;
}

export const useReadinessStore = create<ReadinessState>((set, get) => ({
    readiness: undefined,
    fetchReadiness: async (): Promise<void> => {
        await new Promise<any>((resolve, reject) => {
            KaravanApi.getReadiness(resolve); // resolve the promise when data is available
        })
            .then((readiness) => {
                const currentReadiness = get().readiness;
                if (!isEqual(currentReadiness, readiness)) {
                    set({ readiness: readiness });
                }
            });
    }
}))

