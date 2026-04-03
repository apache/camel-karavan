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


