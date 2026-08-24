import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

export type DashboardSideBarType = 'integration'

interface DashboardState {
    showSideBar: DashboardSideBarType;
    setShowSideBar: (showSideBar: DashboardSideBarType, title?: string) => void;
    title: string;
    setTitle: (title: string) => void;
}

export const useDashboardStore = createWithEqualityFn<DashboardState>((set) => ({
    showSideBar: null,
    setShowSideBar: (showSideBar: DashboardSideBarType, title?: string) => {
        set({ showSideBar: showSideBar, title: title });
    },
    title: null,
    setTitle: (title: string) => {
        set({ title: title });
    },
}), shallow)


