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