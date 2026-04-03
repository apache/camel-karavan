import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import {ProjectValidation} from "@models/ValidationModels";
import isEqual from "lodash/isEqual";
import {ValidationApi} from "@api/ValidationApi";

interface ValidationState {
    validations: ProjectValidation[];
    fetchValidations: () => Promise<void>;
    validateProject: (projectId: string) => Promise<void>;
    validateProjectFile: (projectId: string, filename: string) => Promise<void>
}

export const useValidationStore = createWithEqualityFn<ValidationState>((set, get) => ({
    validations: [],
    fetchValidations: async (): Promise<void> => {
        const currentValidations = get().validations;
        await new Promise<ProjectValidation[]>((resolve) => {
            ValidationApi.getAllProjectValidations(resolve);
        }).then(validations=> {
            if (!isEqual(currentValidations, validations)) {
                set({validations: validations});
            }
        })
    },
    validateProject: async (projectId: string): Promise<void> => {
        ValidationApi.validateProject(projectId, () => {
            setTimeout(() => {
                get().fetchValidations();
            }, 3000);
        });
    },
    validateProjectFile: async (projectId: string, filename: string): Promise<void> => {
        ValidationApi.validateProjectFile(projectId, filename, () => {
            setTimeout(() => {
                get().fetchValidations();
            }, 1000);
        });
    },
}), shallow)
