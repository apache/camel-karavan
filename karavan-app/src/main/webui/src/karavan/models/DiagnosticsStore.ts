import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

interface DiagnosticsState {
    filter: string;
    setFilter: (filter: string) => void;
    envVars: string[];
    setEnvVars: (envVars: string[]) => void;
    appProps: string[];
    setAppProps: (appProps: string[]) => void;
}

export const useDiagnosticsStore = createWithEqualityFn<DiagnosticsState>((set) => ({
    filter: '',
    envVars: [],
    appProps: [],
    setFilter: (filter: string)=> {
        set({filter: filter});
    },
    setEnvVars: (envVars: string[]) => {
        set({envVars: envVars});
    },
    setAppProps: (appProps: string[]) => {
        set({appProps: appProps});
    }
}), shallow)


