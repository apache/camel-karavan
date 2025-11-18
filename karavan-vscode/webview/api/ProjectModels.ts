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

import {ASYNCAPI_FILE_NAME_JSON, ASYNCAPI_FILE_NAME_YAML} from "@/core/contants";

export type FileOperation =
    | "create"
    | "select"
    | "delete"
    | "none"
    | "copy"
    | "upload"
    | "rename"
    | "diff";

export type ProjectOperation = "create" | "select" | "delete" | "none" | "copy"

export type DesignerTab = "routes" | "rest" | "beans" | "kamelet";

export const DOCKER_COMPOSE = "docker-compose.yaml";
export const DOCKER_STACK = "docker-stack.yaml";
export const KUBERNETES_YAML = "kubernetes.yaml";
export const APPLICATION_PROPERTIES = 'application.properties';
export const BUILD_IN_FILES = [APPLICATION_PROPERTIES, DOCKER_COMPOSE, DOCKER_STACK, KUBERNETES_YAML, ASYNCAPI_FILE_NAME_JSON, ASYNCAPI_FILE_NAME_YAML];

export class AppConfig {
    title: string = '';
    version: string = '';
    infrastructure: 'kubernetes' | 'docker' | 'local' = 'local';
    swarmMode: boolean = false;
    environment: string = '';
    environments: string[] = [];
    status: any[] = [];
    configFilenames: any[] = [];
    advanced: any = {}
    platformSecretName: string = '';
    platformConfigName: string = '';
}

export enum ProjectType {
    templates = 'templates',
    kamelets = 'kamelets',
    configuration = 'configuration',
    documentation = 'documentation',
    services = 'services',
    shared = 'shared',
    cache = 'cache',
    integration = 'integration',
}

export const BUILD_IN_PROJECTS: string[] = [
    ProjectType.kamelets.toString(),
    ProjectType.templates.toString(),
    ProjectType.configuration.toString(),
    ProjectType.services.toString(),
    ProjectType.shared.toString(),
    ProjectType.documentation.toString()
];

export const RESERVED_WORDS: string[] = [...BUILD_IN_PROJECTS, 'karavan'];

export class Project {
    projectId: string = '';
    name: string = '';
    lastCommit: string = '';
    lastCommitTimestamp: number = 0;
    type: string = ProjectType.integration;

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
    type: 'devmode' | 'devservice' | 'packaged' | 'internal' | 'build' | 'unknown' = 'unknown';
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

export type ContainerType = 'devmode' | 'devservice' | 'packaged' | 'internal' | 'build' | 'unknown';

export class ContainerStatus {
    containerName: string = '';
    containerId: string = '';
    state: string = '';
    phase: string = '';
    deployment: string = '';
    projectId: string = '';
    env: string = '';
    type: ContainerType = 'unknown';
    memoryInfo: string = '';
    cpuInfo: string = '';
    created: string = '';
    finished: string = '';
    image: string = '';
    commit: string = '';
    podId: string = '';
    ports: ContainerPort [] = [];
    commands: string [] = [];
    inTransit: boolean = false;
    labels: any

    public constructor(init?: Partial<ContainerStatus>) {
        Object.assign(this, init);
    }
}

export class PodEvent {
    id: string = '';
    containerName: string = '';
    reason: string = ''
    note: string = '';
    creationTimestamp: string = '';

    public constructor(init?: Partial<PodEvent>) {
        Object.assign(this, init);
    }
}

export class CamelStatus {
    projectId: string = '';
    containerName: string = '';
    statuses: CamelStatusValue[] = [];
    env: string = '';
}

export type CamelStatusName = 'context' | 'route' | 'processor' | 'consumer';

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
    new ProjectFileType("JAVA", "Java", "java"),
    new ProjectFileType("GROOVY", "Groovy", "groovy"),
    new ProjectFileType("PROPERTIES", "Properties", "properties"),
    new ProjectFileType("JSON", "JSON", "json"),
    new ProjectFileType("OPENAPI", "OpenAPI", "json"),
    new ProjectFileType("ASYNCAPI", "AsyncAPI", "yaml"),
    new ProjectFileType("ASYNCAPI", "AsyncAPI", "json"),
    new ProjectFileType("YAML", "YAML", "yaml"),
    new ProjectFileType("DOCKER", "Docker Compose", "yaml"),
    new ProjectFileType("SH", "Script", "sh"),
    new ProjectFileType("OTHER", "Other", "*"),
];

function getProjectFileType(file: ProjectFile) {
    return getProjectFileTypeByName(file.name);
}

export function getProjectFileTypeByName(fileName: string): ProjectFileType[] {
    if (fileName === DOCKER_COMPOSE) return ProjectFileTypes.filter(p => p.name === "DOCKER")
    if (fileName.endsWith(".camel.yaml")) return ProjectFileTypes.filter(p => p.name === "INTEGRATION")
    if (fileName.endsWith(".kamelet.yaml")) return ProjectFileTypes.filter(p => p.name === "KAMELET")
    if (fileName === "openapi.json") return ProjectFileTypes.filter(p => p.name === "OPENAPI")
    if (fileName === "asyncapi.json") return ProjectFileTypes.filter(p => p.name === "ASYNCAPI")
    if (fileName === "asyncapi.yaml") return ProjectFileTypes.filter(p => p.name === "ASYNCAPI")
    if (fileName.endsWith(".json")) return ProjectFileTypes.filter(p => p.name === "JSON")
    if (fileName.endsWith(".yaml")) return ProjectFileTypes.filter(p => p.name === "YAML")
    if (fileName.endsWith(".yml")) return ProjectFileTypes.filter(p => p.name === "YAML")
    if (fileName.endsWith(".groovy")) return ProjectFileTypes.filter(p => p.name === "GROOVY")
    if (fileName.endsWith(".java")) return ProjectFileTypes.filter(p => p.name === "JAVA")
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
    return ProjectFileTypes.filter(p => p.extension === extension);
}

export function getProjectFileTypeName(file: ProjectFile) {
    const types = getProjectFileType(file);
    return types.length > 0 ? types.map(p => p.name)[0] : "OTHER";
}

export function getProjectFileTypeTitle(file: ProjectFile) {
    const types = getProjectFileType(file);
    return types.length > 0 ? types.map(p => p.title)[0] : "Other";
}

export function getProjectFileTypeByNameTitle(fileName: string) {
    const types = getProjectFileTypeByName(fileName);
    return types.length > 0 ? types.map(p => p.title)[0] : "Other";
}

