import {DslMetaModel} from "@features/project/designer/utils/DslMetaModel";
import {Project} from "@models/ProjectModels";

export type ProjectFunctions = {
    createNewRouteFile: (dsl: DslMetaModel, parentId: string, position?: number | undefined, fileName?: string) => void;
    createOpenApiRestFile: () => void;
    createNewBean: () => void;
    createNewKamelet: () => void;
    createRouteConfiguration: () => void;
    createOpenApi: () => void;
    createAsyncApi: () => void;
    createNewRestFile: () => void;
    refreshData: () => void;
    refreshSharedData: () => void;
    project: Project
};

// 2. Define the hook FUNCTION'S signature
export type UseProjectHook = () => ProjectFunctions;