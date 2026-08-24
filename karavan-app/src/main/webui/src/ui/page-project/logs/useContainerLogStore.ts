import {create} from "zustand";

interface ContainerLogState {
    isTextWrapped: boolean;
    autoScroll: boolean;

    setIsTextWrapped: (isTextWrapped: boolean) => void;
    setAutoScroll: (autoScroll: boolean) => void;
}

export const useContainerLogStore = create<ContainerLogState>((set, get) => ({
    isTextWrapped: true,
    autoScroll: true,

    setIsTextWrapped: (isTextWrapped: boolean) => set({isTextWrapped}),
    setAutoScroll: (autoScroll: boolean) => set({autoScroll}),
}));