export class Error {
    field: string = '';
    message: string = '';
    code: string = '';

    constructor(field: string, message: string, code: string) {
        this.field = field;
        this.message = message;
        this.code = code;
    }
}