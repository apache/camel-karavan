import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import type * as monaco from "monaco-editor";

interface DeveloperState {
    loading: boolean;
    isValid: boolean;
    errors: monaco.editor.IMarker[]
    setLoading: (loading: boolean) => void;
    setValidation: (isValid: boolean, errors: monaco.editor.IMarker[]) => void;
}

export const useDeveloperStore = createWithEqualityFn<DeveloperState>((set) => ({
    loading: false,
    isValid: true,
    errors: [],
    setLoading: (loading: boolean) => {
        set({loading: loading})
    },
    setValidation: (isValid: boolean, errors: monaco.editor.IMarker[]) => {
        set({isValid: isValid, errors: errors})
    },
}), shallow)