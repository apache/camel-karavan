export function isEmpty(str: string) {
    return !str?.trim();
}

export function isValidFileName(input: string): boolean {
    const pattern =/^[a-zA-Z0-9._-]+$/;
    return pattern.test(input);
}

export function isValidProjectId(input: string): boolean {
    const pattern = /^[a-z][a-z0-9-]*$/;
    return pattern.test(input);
}

export function splitByBraces(input: string): string[] {
    const regex = /{[^{}]*}|[^{}]+/g;
    return input.match(regex) ?? [];
}

export function getPathParams(input: string): string[] {
    return splitByBraces(input).filter(p => p.startsWith('{')).map(p => p.replace('{', '').replace('}', ''));
}

export function getShortCommit(commitId: string): string {
    return commitId ? commitId?.substring(0, 7) : "-";
}

export function hasLowercase(password: string): boolean {
    const pattern = /[a-z]/;
    return pattern.test(password);
}

export function hasUppercase(password: string): boolean {
    const pattern = /[A-Z]/;
    return pattern.test(password);
}

export function hasDigit(password: string): boolean {
    const pattern = /\d/;
    return pattern.test(password);
}

export function hasSpecialCharacter(password: string): boolean {
    const pattern = /[@$!%*?&]/;
    return pattern.test(password);
}

export function hasMinimumLength(password: string, minLength: number = 8): boolean {
    return password.length >= minLength;
}


export function isValidPassword(password: string): boolean {
    return hasLowercase(password) &&
        hasUppercase(password) &&
        hasDigit(password) &&
        hasSpecialCharacter(password) &&
        hasMinimumLength(password);
}

export function getMegabytes(bytes?: number): number {
    return (bytes ? (bytes / 1024 / 1024) : 0);
}
