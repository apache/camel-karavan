export interface JsonSchemaProperty {
    type?: string;
    const?: string;
    description?: string;
    format?: string;
    enum?: string[];
    minLength?: number;
    additionalProperties?: boolean;
}

export interface JsonSchema {
    $schema: string;
    $id: string;
    title: string;
    description?: string;
    type: "object";
    required?: string[];
    properties: Record<string, JsonSchemaProperty>;
    additionalProperties?: boolean;
}

export interface ProjectInfo {
    projectId: string;
    isDevModeRunning: boolean;
    isPackagedRunning: boolean;
    isBuildRunning: boolean;
    routes: RouteComponentsInfo[];
    exposesOpenApi: boolean;
    implementsAsyncApi: boolean;
}

export interface RouteComponentsInfo {
    routeId: string;
    nodePrefixId: string;
    routeTemplateRef: string;
    isTemplated: boolean;
    fileName: string;
    consumers: ComponentInfo[];
    producers: ComponentInfo[];
}

export interface ComponentInfo {
    id: string;
    name: string;
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

export const CHANNEL_PREFIX = "channel";
export const MESSAGE_PREFIX = "message"; // fixed duplicate value
export const TAG_PREFIX = "message"; // fixed duplicate value
export const OPERATION_PREFIX = "operation";
export const APPLICATION_PREFIX = "application";
export const SERVER_PREFIX = "server";
export const X_APPLICATIONS = "x-applications";
export const X_APPLICATION_ID = "x-application-id";
export const X_CAMEL_CONFIGURATION_REF = "x-camel-configuration-ref";
export const X_CAMEL_SEND_REF = "x-camel-send-ref";
export const X_CAMEL_RECEIVE_REF = "x-camel-receive-ref";
export const X_CAMEL_ROUTE_REF = "x-camel-route-ref";
export const EXTENSIONS_FIELD_NAME = "extensions";
export const GENERATED_FILENAME_PREFIX = "_gen_";


export const HTTP_METHODS_LOWERCASE: string[] = [
    'get',
    'post',
    'put',
    'patch',
    'delete',
    'head'
]

export const HTTP_METHODS: string[] = HTTP_METHODS_LOWERCASE.map(m => m.toUpperCase());