import {DslMetaModel} from "@/integration-designer/utils/DslMetaModel";

export type ProjectFunctions = {
    createNewRouteFile: (dsl: DslMetaModel, parentId: string, position?: number | undefined, fileName?: string) => void;
    createOpenApiRestFile: () => void;
    createNewBean: () => void;
    createNewKamelet: () => void;
    createRouteConfiguration: () => void;
    createOpenApiJsonFile: () => void;
    createAsyncApiJsonFile: () => void;
    createNewRestFile: () => void;
    refreshData: () => void;
    refreshSharedData: () => void;
    isOpenApiExists: () => boolean;
    isAsyncApiExists: () => boolean;
};

// 2. Define the hook FUNCTION'S signature
export type UseProjectHook = () => ProjectFunctions;