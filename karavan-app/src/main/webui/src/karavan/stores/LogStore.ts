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
import {ProjectEventBus} from "@bus/ProjectEventBus";
import {unstable_batchedUpdates} from "react-dom";
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

const MAX_LOG_LINES = 1000;

interface LogState {
    podName?: string,
    data: string[];
    setData: (data: string[]) => void;
}

export const useLogStore = createWithEqualityFn<LogState>((set) => ({
    podName: undefined,
    data: [],
    setData: (data: string[]) => {
        set({data: data})
    }
}), shallow)

const sub = ProjectEventBus.onLog()?.subscribe((result: ["add" | "set", string]) => {
    if (result[0] === 'add') {
        unstable_batchedUpdates(() => {
            useLogStore.setState((state: LogState) => {
                const newEntry = result[1]?.length !== 0 ? result[1] : "\n";

                // Combine, then slice from the end (negative index)
                const newData = [...state.data, newEntry];
                const trimmedData = newData.length > MAX_LOG_LINES
                    ? newData.slice(-MAX_LOG_LINES)
                    : newData;

                return { data: trimmedData };
            })
        })
    } else if (result[0] === 'set') {
        unstable_batchedUpdates(() => {
            useLogStore.setState({data: [result[1]]});
        })
    }
});