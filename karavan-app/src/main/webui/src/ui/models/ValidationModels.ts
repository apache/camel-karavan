export class ProjectValidation {
    projectId: string = '';
    lastValidate: number = 0;
    files: ProjectFileValidation[] = [];
    hasErrors: boolean = false;
}

export class ProjectFileValidation {
    name: string = '';
    errors: any[] = [];
    hasErrors: boolean = false;
}
