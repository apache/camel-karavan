import {Error} from "./Error";

export class ErrorResponse {
    status: number = 0;
    error: string = '';
    message: string = '';
    errors: Array<Error> = [];

    constructor(status: number, error: string, message: string, errors: Array<Error>) {
        this.status = status;
        this.error = error;
        this.message = message;
        this.errors = errors;
    }
}