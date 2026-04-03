import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

export type ProjectPageSideBarType = 'route' | 'openAPI' | any | null;

interface ProjectPageState {
    showSideBar: ProjectPageSideBarType;
    setShowSideBar: (showSideBar: ProjectPageSideBarType, title?: string) => void;
    title: string;
    setTitle: (title: string) => void;
}

export const useProjectPageStore = createWithEqualityFn<ProjectPageState>((set) => ({
    showSideBar: null,
    setShowSideBar: (showSideBar: ProjectPageSideBarType, title?: string) => {
        set({ showSideBar: showSideBar, title: title });
    },
    title: null,
    setTitle: (title: string) => {
        set({ title: title });
    },
}), shallow)


