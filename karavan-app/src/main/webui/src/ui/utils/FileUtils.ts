import {ProjectFile} from "@models/ProjectModels";

export function upsertFile(files: ProjectFile[], file: ProjectFile): ProjectFile[] {
    const index = files.findIndex(f => f.name === file.name);

    if (index !== -1) {
        files[index] = file;
    } else {
        files.push(file);
    }
    return [...files];
}
