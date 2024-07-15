/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export class AppConfig {
    title: string = '';
    version: string = '';
    infrastructure: 'kubernetes' | 'docker' | 'local' = 'local';
    environment: string = '';
    environments: string[] = [];
    status: any[] = [];
    configFilenames: any[] = [];
    advanced: any = {}
}

export enum ProjectType {
    templates ='templates',
    kamelets ='kamelets',
    configuration ='configuration',
    normal ='normal',
}

export const BUILD_IN_PROJECTS: string[] = [ProjectType.kamelets.toString(), ProjectType.templates.toString(), ProjectType.configuration.toString()];

export class Project {
    projectId: string = '';
    name: string = '';
    lastCommit: string = '';
    lastCommitTimestamp: number = 0;
    type: string = ProjectType.normal;

    public constructor(projectId: string, name: string, lastCommit: string, type: string);
    public constructor(init?: Partial<Project>);
    public constructor(...args: any[]) {
        if (args.length === 1) {
            Object.assign(this, args[0]);
            return;
        } else {
            this.projectId = args[0];
            this.name = args[1];
            this.lastCommit = args[2];
            this.lastCommitTimestamp = args[3];
            this.type = args[4];
            return;
        }
    }
}

export class DeploymentStatus {
    projectId: string = '';
    env: string = '';
    namespace: string = '';
    cluster: string = '';
    image: string = '';
    replicas: number = 0;
    readyReplicas: number = 0;
    unavailableReplicas: number = 0;
}

export class ServiceStatus {
    name: string = '';
    env: string = '';
    namespace: string = '';
    cluster: string = '';
    port: string = '';
    targetPort: string = '';
    clusterIP: string = '';
    type: string = '';
}

export class ContainerPort {
    privatePort?: number;
    publicPort?: number;
    type: string = '';
}

export class ContainerStatus {
    containerName: string = '';
    containerId: string = '';
    state: string = '';
    phase: string = '';
    deployment: string = '';
    projectId: string = '';
    env: string = '';
    type: 'devmode' | 'devservice' | 'project' | 'internal' | 'build' | 'unknown' = 'unknown';
    memoryInfo: string = '';
    cpuInfo: string = '';
    created: string = '';
    finished: string = '';
    image: string = '';
    commit: string = '';
    ports: ContainerPort [] = [];
    commands: string [] = [];
    inTransit: boolean = false;
    camelRuntime: string = ''

    public constructor(init?: Partial<ContainerStatus>) {
        Object.assign(this, init);
    }
}

export class CamelStatus {
    projectId: string = '';
    containerName: string = '';
    statuses: CamelStatusValue[] = [];
    env: string = '';
}

export class CamelStatusValue {
    name: string = '';
    status: string = '';
}

export class ProjectFile {
    name: string = '';
    projectId: string = '';
    code: string = '';
    lastUpdate: number;

    constructor(name: string, projectId: string, code: string, lastUpdate: number) {
        this.name = name;
        this.projectId = projectId;
        this.code = code;
        this.lastUpdate = lastUpdate;
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

export class ContainerImage {
    id: string = '';
    tag: string = '';
    size: number = 0;
    created: number = 0;
}

export const ProjectFileTypes: ProjectFileType[] = [
    new ProjectFileType("INTEGRATION", "Integration", "camel.yaml"),
    new ProjectFileType("KAMELET", "Kamelet", "kamelet.yaml"),
    new ProjectFileType("CODE", "Code", "java"),
    new ProjectFileType("PROPERTIES", "Properties", "properties"),
    new ProjectFileType("JSON", "JSON", "json"),
    new ProjectFileType("YAML", "YAML", "yaml"),
    new ProjectFileType("SH", "Script", "sh"),
    new ProjectFileType("OTHER", "Other", "*"),
];

function getProjectFileType (file: ProjectFile) {
    return getProjectFileTypeByName(file.name);
}

function getProjectFileTypeByName (fileName: string) {
    if (fileName.endsWith(".camel.yaml")) return ProjectFileTypes.filter(p => p.name === "INTEGRATION")
    if (fileName.endsWith(".kamelet.yaml")) return ProjectFileTypes.filter(p => p.name === "KAMELET")
    if (fileName.endsWith(".json")) return ProjectFileTypes.filter(p => p.name === "JSON")
    if (fileName.endsWith(".yaml")) return ProjectFileTypes.filter(p => p.name === "YAML")
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
    return ProjectFileTypes.filter(p => p.extension === extension);
}

export function getProjectFileTypeName (file: ProjectFile) {
    const types = getProjectFileType(file);
    return types.length >0 ? types.map(p => p.name)[0] : "OTHER";
}

export function getProjectFileTypeTitle (file: ProjectFile) {
    const types = getProjectFileType(file);
    return types.length >0 ? types.map(p => p.title)[0] : "Other";
}

export function getProjectFileTypeByNameTitle (fileName: string) {
    const types = getProjectFileTypeByName(fileName);
    return types.length >0 ? types.map(p => p.title)[0] : "Other";
}

