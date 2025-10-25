import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

interface CodeState {
    code: string;
    setCode: (code: string) => void;
}

export const useCodeStore = createWithEqualityFn<CodeState>((set) => ({
    code: '',
    setCode: (code: string) => {
        set({code: code});
    },
}), shallow)