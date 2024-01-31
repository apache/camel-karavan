import {ProjectFile} from "../api/ProjectModels";

export function isEmpty(str: string) {
    return !str?.trim();
}

export function getPropertyPlaceholders(files: ProjectFile[]): string[] {
    const result: string[] = []
    const file = files.filter(f => f.name === 'application.properties')?.at(0);
    if (file) {
        const code = file.code;
        const lines = code.split('\n').map((line) => line.trim());
        lines
            .filter(line => !line.startsWith("camel.") && !line.startsWith("jkube.") && !line.startsWith("jib."))
            .filter(line => line !== undefined && line !== null && line.length > 0)
            .forEach(line => {
            const parts = line.split("=");
            if (parts.length > 0) {
                result.push(parts[0]);
            }
        })
    }
    return result;
}