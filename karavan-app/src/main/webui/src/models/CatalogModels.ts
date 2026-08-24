import {ComplexityRouteType} from "./ComplexityModels";

export interface ProjectInfo {
    projectId: string;
    isDevModeRunning: boolean;
    isPackagedRunning: boolean;
    isBuildRunning: boolean;
    routes: RouteComponentsInfo[];
    exposesOpenApi: boolean;
}

export interface RouteComponentsInfo {
    routeId: string;
    nodePrefixId: string;
    routeTemplateRef: string;
    type: ComplexityRouteType;
    fileName: string;
    consumers: ComponentInfo[];
    producers: ComponentInfo[];
}

export interface ComponentInfo {
    id: string;
    name: string;
    remote: boolean;
    parameters: Record<string, string>;
}

export interface OperationStatistic {
    action: string;
    protocol: string;
    address: string;
    total: number;
    inflight: number;
    failed: number;
    projectId?: string;
}
