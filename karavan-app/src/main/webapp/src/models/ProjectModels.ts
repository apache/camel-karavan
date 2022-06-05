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