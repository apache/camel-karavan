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

import {create} from 'zustand'
import {
    AppConfig,
    DeploymentStatus,
    ContainerStatus,
    Project,
    ProjectFile,
    ServiceStatus,
    CamelStatus,
    PipelineStatus
} from "./ProjectModels";
import {ProjectEventBus} from "./ProjectEventBus";
import {unstable_batchedUpdates} from "react-dom";
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";

interface AppConfigState {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    config: AppConfig;
    setConfig: (config: AppConfig) => void;
    readiness: any;
    setReadiness: (readiness: any) => void;
}

export const useAppConfigStore = createWithEqualityFn<AppConfigState>((set) => ({
    loading: false,
    setLoading: (loading: boolean)  => {
        set({loading: loading})
    },
    config: new AppConfig(),
    setConfig: (config: AppConfig)  => {
        set({config: config})
    },
    readiness: undefined,
    setReadiness: (readiness: any)  => {
        set({readiness: readiness})
    },
}), shallow)


interface ProjectsState {
    projects: Project[];
    setProjects: (projects: Project[]) => void;
    upsertProject: (project: Project) => void;
}

export const useProjectsStore = createWithEqualityFn<ProjectsState>((set) => ({
    projects: [],
    setProjects: (ps: Project[]) => {
        set((state: ProjectsState) => ({
            projects: ps,
        }));
    },
    upsertProject: (project: Project) => {
        set((state: ProjectsState) => ({
            projects: state.projects.find(f => f.projectId === project.projectId) === undefined
                ? [...state.projects, project]
                : [...state.projects.filter(f => f.projectId !== project.projectId), project]
        }));
    }
}), shallow)

interface ProjectState {
    isPushing: boolean,
    isRunning: boolean,
    project: Project;
    setProject: (project: Project, operation:  "create" | "select" | "delete"| "none" | "copy") => void;
    operation: "create" | "select" | "delete" | "none" | "copy";
    setOperation: (o: "create" | "select" | "delete"| "none" | "copy") => void;
    memory: any,
    setMemory: (memory: any) => void;
    jvm: any,
    setJvm: (jvm: any) => void;
    context: any,
    setContext: (context: any) => void;
    trace: any,
    setTrace: (trace: any) => void;
    refreshTrace: boolean
    setRefreshTrace: (refreshTrace: boolean) => void;
}

export const useProjectStore = createWithEqualityFn<ProjectState>((set) => ({
    project: new Project(),
    operation: "none",
    isPushing: false,
    isRunning: false,
    setProject: (project: Project, operation:  "create" | "select" | "delete"| "none" | "copy") => {
        set((state: ProjectState) => ({
            project: project,
            operation: operation,
            refreshTrace: false,
            jvm: {},
            context: {},
            trace: {},
            memory: {},
        }));
    },
    setOperation: (o: "create" | "select" | "delete"| "none" | "copy") => {
        set((state: ProjectState) => ({
            operation: o
        }));
    },
    memory: {},
    setMemory: (memory: boolean)  => {
        set({memory: memory})
    },
    jvm: {},
    setJvm: (jvm: boolean)  => {
        set({jvm: jvm})
    },
    context: {},
    setContext: (context: boolean)  => {
        set({context: context})
    },
    trace: {},
    setTrace: (trace: boolean)  => {
        set({trace: trace})
    },
    refreshTrace: false,
    setRefreshTrace: (refreshTrace: boolean)  => {
        set({refreshTrace: refreshTrace})
    },
}), shallow)

interface FilesState {
    files: ProjectFile[];
    setFiles: (files: ProjectFile[]) => void;
    upsertFile: (file: ProjectFile) => void;
}

export const useFilesStore = createWithEqualityFn<FilesState>((set) => ({
    files: [],
    setFiles: (files: ProjectFile[]) => {
        set((state: FilesState) => ({
            files: files
        }));
    },
    upsertFile: (file: ProjectFile) => {
        set((state: FilesState) => ({
            files: state.files.find(f => f.name === file.name) === undefined
                ? [...state.files, file]
                : [...state.files.filter(f => f.name !== file.name), file]
        }));
    }
}), shallow)

interface FileState {
    file?: ProjectFile;
    operation: "create" | "select" | "delete" | "none" | "copy" | "upload";
    setFile: (operation:  "create" | "select" | "delete"| "none" | "copy" | "upload", file?: ProjectFile) => void;
    editAdvancedProperties: boolean;
    setEditAdvancedProperties: (editAdvancedProperties: boolean) => void;
    addProperty: string;
    setAddProperty: (addProperty: string) => void;
    mode: "design" | "code",
    setMode: (mode: "design" | "code") => void;
}

export const useFileStore = createWithEqualityFn<FileState>((set) => ({
    file: undefined,
    operation: "none",
    editAdvancedProperties: false,
    addProperty: '',
    mode: "design",
    setMode: (mode: "design" | "code") => {
        set(() => ({mode: mode}));
    },
    setFile: (operation:  "create" | "select" | "delete"| "none" | "copy" | "upload", file?: ProjectFile) => {
        set((state: FileState) => ({
            file: file,
            operation: operation
        }));
    },
    setEditAdvancedProperties: (editAdvancedProperties: boolean) => {
        set(() => ({editAdvancedProperties: editAdvancedProperties}));
    },
    setAddProperty: (addProperty: string) => {
        set(() => ({addProperty: addProperty}));
    },
}), shallow)

interface DevModeState {
    podName?: string,
    status: "none" | "wip",
    setStatus: (status: "none" | "wip") => void,
    setPodName: (podName?: string) => void,
}

export const useDevModeStore = createWithEqualityFn<DevModeState>((set) => ({
    podName: undefined,
    status: "none",
    setStatus: (status: "none" | "wip") =>  {
        set((state: DevModeState) => ({
            status: status,
        }));
    },
    setPodName: (podName?: string) =>  {
        set((state: DevModeState) => ({
            podName: podName,
        }));
    },
}), shallow)

interface StatusesState {
    deployments: DeploymentStatus[];
    services: ServiceStatus[];
    containers: ContainerStatus[];
    camels: CamelStatus[];
    setDeployments: (d: DeploymentStatus[]) => void;
    setServices: (s: ServiceStatus[]) => void;
    setContainers: (c: ContainerStatus[]) => void;
    setCamels: (c: CamelStatus[]) => void;
    pipelineStatuses: PipelineStatus[],
    setPipelineStatuses: (pipelineStatus: PipelineStatus[]) => void;
}

export const useStatusesStore = createWithEqualityFn<StatusesState>((set) => ({
    deployments: [],
    services: [],
    containers: [],
    camels: [],
    setDeployments: (d: DeploymentStatus[]) => {
        set((state: StatusesState) => ({
            deployments: d,
        }));
    },
    setServices: (s: ServiceStatus[]) => {
        set((state: StatusesState) => ({
            services: s,
        }));
    },
    setContainers: (c: ContainerStatus[]) => {
        set((state: StatusesState) => ({
            containers: c,
        }));
    },
    setCamels: (c: CamelStatus[]) => {
        set((state: StatusesState) => ({
            camels: c,
        }));
    },
    pipelineStatuses: [],
    setPipelineStatuses: (pipelineStatuses: PipelineStatus[])  => {
        set({pipelineStatuses: pipelineStatuses})
    },
}), shallow)

interface LogState {
    podName?: string,
    data: string;
    setData: (data: string) => void;
    addData: (data: string) => void;
    addDataAsync: (data: string) => void;
    currentLine: number;
    setCurrentLine: (currentLine: number) => void;
    showLog: boolean,
    setShowLog: (showLog: boolean, type: 'container' | 'build' | 'none', podName: string) => void;
    type: 'container' | 'build' | 'none',
    setType: (type: 'container' | 'build' | 'none') => void,
}

export const useLogStore = createWithEqualityFn<LogState>((set) => ({
    podName: undefined,
    data: '',
    setData: (data: string)  => {
        set({data: data})
    },
    addData: (data: string)  => {
        set((state: LogState) => {
            const delimiter = state.data.endsWith('\n') ? '' : '\n';
            return ({data: state.data.concat(delimiter, data)})
        })
    },
    addDataAsync: async (data: string) => {
        set((state: LogState) => {
            const delimiter = state.data.endsWith('\n') ? '' : '\n';
            return ({data: state.data.concat(delimiter, data)})
        })
    },
    currentLine: 0,
    setCurrentLine: (currentLine: number)  => {
        set((state: LogState) => ({currentLine: currentLine}))
    },
    showLog: false,
    setShowLog: (showLog: boolean, type: 'container' | 'build' | 'none', podName: string) => {
        set(() => ({showLog: showLog, type: type, podName: podName}));
    },
    type: "none",
    setType: (type: 'container' | 'build' | 'none') =>  {
        set((state: LogState) => ({type: type}));
    },
}), shallow)

console.log("Start log subscriber");
const sub = ProjectEventBus.onLog()?.subscribe((result: ["add" | "set", string]) => {
    if (result[0] === 'add') {
        unstable_batchedUpdates(() => {
            useLogStore.setState((state: LogState) => {
                const delimiter = state.data.endsWith('\n') ? '' : '\n';
                const newData  = state.data ? state.data.concat(delimiter, result[1]) : result[1]
                return ({data: newData, currentLine: state.currentLine+1});
            })
        })
    }
    else if (result[0] === 'set') {
        unstable_batchedUpdates(() => {
            useLogStore.setState({data: result[1], currentLine: 0});
        })
    }
});
