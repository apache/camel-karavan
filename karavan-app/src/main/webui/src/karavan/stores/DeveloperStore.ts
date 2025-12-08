import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

interface DeveloperState {
    loading: boolean;
    setLoading: (loading: boolean) => void;
}

export const useDeveloperStore = createWithEqualityFn<DeveloperState>((set) => ({
    loading: false,
    setLoading: (loading: boolean) => {
        set({loading: loading})
    },
}), shallow)