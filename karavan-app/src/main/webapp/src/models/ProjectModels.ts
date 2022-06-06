export class Project {
    name: string = '';
    version: string = '';
    folder: string = '';
    type: string = '';

    constructor(name: string, version: string, folder: string, type: string) {
        this.name = name;
        this.version = version;
        this.folder = folder;
        this.type = type;
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