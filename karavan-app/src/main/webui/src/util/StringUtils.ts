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
