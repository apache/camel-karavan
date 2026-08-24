import {create} from "zustand";
import isEqual from "lodash/isEqual";
import {PodEvent} from "@models/ProjectModels";
import {KubernetesApi} from "@api/KubernetesApi";

interface KubernetesState {
    podEvents: PodEvent[];

    fetchPodEvents: (containerName: string) => Promise<void>;
    clearPodEvents: () => void;
}

export const useKubernetesStore = create<KubernetesState>((set, get) => ({
    podEvents: [],
    fetchPodEvents: async (containerName: string): Promise<void> => {
        try {
            const podEvents: PodEvent[] = await KubernetesApi.getPodEvents(containerName);
            if (!isEqual(get().podEvents, podEvents)) {
                set({podEvents: podEvents});
            }
        } catch (error) {
            console.error("Failed to fetch reports for project", error);
        }
    },
    clearPodEvents: () => {
        set({podEvents: []})
    }
}));