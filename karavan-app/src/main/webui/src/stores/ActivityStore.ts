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
import {create} from "zustand";
import isEqual from "lodash/isEqual";

interface ActivityState {
    projectsActivities?: any;
    fetchProjectsActivities: () => Promise<void>;
    usersActivities?: any;
    fetchUsersActivities: () => Promise<void>;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
    projectsActivities: {},
    usersActivities: {},
    fetchProjectsActivities: async (): Promise<void> => {
        const currentActivities = get().projectsActivities;
        await new Promise<any>((resolve) => {
            KaravanApi.getProjectsActivities(resolve);
        }).then(activities=> {
            if (!isEqual(currentActivities, activities)) {
                set({projectsActivities: activities});
            }
        })
    },
    fetchUsersActivities: async (): Promise<void> => {
        const currentActivities = get().usersActivities;
        await new Promise<any>((resolve) => {
            KaravanApi.getUsersActivities(resolve);
        }).then(activities=> {
            if (!isEqual(currentActivities, activities)) {
                set({usersActivities: activities});
            }
        })
    },
}))


