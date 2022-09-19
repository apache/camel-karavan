export class Project {
    projectId: string = '';
    name: string = '';
    description: string = '';
    lastCommit: string = '';
    deployed: boolean = false;

    public constructor(projectId: string, name: string, description: string, lastCommit: string);
    public constructor(init?: Partial<Project>);
    public constructor(...args: any[]) {
        if (args.length === 1){
            Object.assign(this, args[0]);
            return;
        } else {
            this.projectId = args[0];
            this.name = args[1];
            this.description = args[2];
            this.lastCommit = args[3];
            return;
        }
    }
}

export class ProjectEnvStatus {
    environment: string = '';
    status: string = '';
    contextStatus: string = '';
    consumerStatus: string = '';
    routesStatus: string = '';
    registryStatus: string = '';
    contextVersion: string = '';
    lastPipelineRun: string = '';
    lastPipelineRunResult: string = '';
    lastPipelineRunTime: number = 0;
    deploymentStatus: DeploymentStatus = new DeploymentStatus();
}

export class DeploymentStatus {
    image: string = '';
    replicas: number = 0;
    readyReplicas: number = 0;
    unavailableReplicas: number = 0;
    podStatuses: PodStatus[] = []
}

export class PodStatus {
    name: string = '';
    started: boolean = false;
    ready: boolean = false;
    reason: string = '';
    deployment: string = '';
}

export class ProjectStatus {
    projectId: string = '';
    lastUpdate: number = 0;
    statuses: ProjectEnvStatus[] = [];
}

export class ProjectFile {
    name: string = '';
    projectId: string = '';
    code: string = '';

    constructor(name: string, projectId: string, code: string) {
        this.name = name;
        this.projectId = projectId;
        this.code = code;
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
    new ProjectFileType("INTEGRATION", "Integration", "yaml"),
    new ProjectFileType("CODE", "Code", "java"),
    new ProjectFileType("CODE", "Code", "groovy"),
    new ProjectFileType("PROPERTIES", "Properties", "properties"),
    new ProjectFileType("OPENAPI", "OpenAPI", "json"),
    new ProjectFileType("OPENAPI", "OpenAPI", "yaml"),
    new ProjectFileType("LOG", "Log", "log"),
];