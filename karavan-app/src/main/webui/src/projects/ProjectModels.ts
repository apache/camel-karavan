export class Project {
    projectId: string = '';
    name: string = '';
    description: string = '';
    runtime: string = '';
    lastCommit: string = '';
    lastCommitTimestamp: number = 0;

    public constructor(projectId: string, name: string, description: string, runtime: string, lastCommit: string);
    public constructor(init?: Partial<Project>);
    public constructor(...args: any[]) {
        if (args.length === 1) {
            Object.assign(this, args[0]);
            return;
        } else {
            this.projectId = args[0];
            this.name = args[1];
            this.description = args[2];
            this.runtime = args[3];
            this.lastCommit = args[4];
            this.lastCommitTimestamp = args[5];
            return;
        }
    }
}

export class DeploymentStatus {
    name: string = '';
    env: string = '';
    namespace: string = '';
    cluster: string = '';
    image: string = '';
    replicas: number = 0;
    readyReplicas: number = 0;
    unavailableReplicas: number = 0;
}

export class ServiceStatus {
    name: string = '';
    env: string = '';
    namespace: string = '';
    cluster: string = '';
    port: string = '';
    targetPort: string = '';
    clusterIP: string = '';
    type: string = '';
}

export class PodStatus {
    name: string = '';
    phase: string = '';
    started: boolean = false;
    ready: boolean = false;
    reason: string = '';
    deployment: string = '';
}

export class CamelStatus {
    projectId: string = '';
    registryStatus: string = '';
    routesStatus: string = '';
    consumerStatus: string = '';
    contextStatus: string = '';
    contextVersion: string = '';
    env: string = '';
}

export class PipelineStatus {
    projectId: string = '';
    pipelineName: string = '';
    result: string = '';
    startTime: string = '';
    completionTime: string = '';
}

export class ProjectFile {
    name: string = '';
    projectId: string = '';
    code: string = '';
    lastUpdate: number;

    constructor(name: string, projectId: string, code: string, lastUpdate: number) {
        this.name = name;
        this.projectId = projectId;
        this.code = code;
        this.lastUpdate = lastUpdate;
    }
}

export class ProjectFileType {
    name: string = '';
    title: string = '';
    extension: string = '';


    constructor(name: string, title: string, extension: string) {
        this.name = name;
        this.title = title;
        this.extension = extension;
    }
}

export const ProjectFileTypes: ProjectFileType[] = [
    new ProjectFileType("INTEGRATION", "Integration", "camel.yaml"),
    new ProjectFileType("KAMELET", "Kamelet", "kamelet.yaml"),
    new ProjectFileType("CODE", "Code", "java"),
    new ProjectFileType("PROPERTIES", "Properties", "properties"),
    new ProjectFileType("OPENAPI_JSON", "OpenAPI JSON", "json"),
    new ProjectFileType("OPENAPI_YAML", "OpenAPI YAML", "yaml"),
    new ProjectFileType("LOG", "Log", "log"),
];


export function getProjectFileType (file: ProjectFile) {
    if (file.name.endsWith(".camel.yaml")) return ProjectFileTypes.filter(p => p.name === "INTEGRATION").map(p => p.title)[0];
    if (file.name.endsWith(".kamelet.yaml")) return ProjectFileTypes.filter(p => p.name === "KAMELET").map(p => p.title)[0];
    if (file.name.endsWith(".json")) return ProjectFileTypes.filter(p => p.name === "OPENAPI_JSON").map(p => p.title)[0];
    if (file.name.endsWith(".yaml")) return ProjectFileTypes.filter(p => p.name === "OPENAPI_YAML").map(p => p.title)[0];
    const extension = file.name.substring(file.name.lastIndexOf('.') + 1);
    return ProjectFileTypes.filter(p => p.extension === extension).map(p => p.title)[0];
}