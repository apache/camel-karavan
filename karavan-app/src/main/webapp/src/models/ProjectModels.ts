export class Project {
    groupId: string = '';
    artifactId: string = '';
    version: string = '';
    folder: string = '';
    runtime: string = '';
    lastCommit: string = '';


    public constructor(groupId: string, artifactId: string, version: string, folder: string, runtime: string, lastCommit: string);
    public constructor(init?: Partial<Project>);
    public constructor(...args: any[]) {
        if (args.length === 1){
            Object.assign(this, args[0]);
            return;
        } else {
            this.groupId = args[0];
            this.artifactId = args[1];
            this.version = args[2];
            this.folder = args[3];
            this.runtime = args[4];
            this.lastCommit = args[5];
            return;
        }
    }

    getKey():string{
        return this.groupId + ":" + this.artifactId + ":" + this.version;
    }
}

export class ProjectFile {
    name: string = '';
    project: string = '';
    code: string = '';

    constructor(name: string, project: string, code: string) {
        this.name = name;
        this.project = project;
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
];