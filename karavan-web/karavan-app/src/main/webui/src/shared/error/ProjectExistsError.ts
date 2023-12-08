export class ProjectExistsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProjectExistsError';
    }
}