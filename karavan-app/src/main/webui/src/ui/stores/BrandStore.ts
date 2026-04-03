import {create} from "zustand";
import {KaravanApi} from "@api/KaravanApi";
import {ProjectFile, ProjectType} from "@models/ProjectModels";

interface BrandState {
    customLogo?: string;
    customName?: string;
    fetchBrand: () => Promise<void>;
}

export const useBrandStore = create<BrandState>((set, get) => ({
    fetchBrand: async (): Promise<void> => {
        const logoP = new Promise<ProjectFile>((resolve) => {
            KaravanApi.getProjectFilesByName(ProjectType.configuration, 'logo.svg', resolve)
        });

        const nameP = new Promise<ProjectFile>((resolve) => {
            KaravanApi.getProjectFilesByName(ProjectType.configuration, 'name.svg', resolve)
        });

        // Wait for BOTH API calls
        const [logo, name] = await Promise.all([logoP, nameP]);
        set({customLogo: logo?.code, customName: name?.code});
    }
}))