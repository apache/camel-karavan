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
import {AppConfig, DeploymentStatus, PodStatus, Project, ProjectFile, ToastMessage} from "./ProjectModels";
import {ProjectEventBus} from "./ProjectEventBus";
import {unstable_batchedUpdates} from "react-dom";

interface AppConfigState {
    config: AppConfig;
    setConfig: (config: AppConfig) => void;
}

export const useAppConfigStore = create<AppConfigState>((set) => ({
    config: new AppConfig(),
    setConfig: (config: AppConfig)  => {
        set({config: config}, true)
    },
}))


interface ProjectsState {
    projects: Project[];
    setProjects: (projects: Project[]) => void;
    upsertProject: (project: Project) => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
    projects: [],
    setProjects: (ps: Project[]) => {
        set((state: ProjectsState) => ({
            projects: ps,
        }), true);
    },
    upsertProject: (project: Project) => {
        set((state: ProjectsState) => ({
            projects: state.projects.find(f => f.projectId === project.projectId) === undefined
                ? [...state.projects, project]
                : [...state.projects.filter(f => f.projectId !== project.projectId), project]
        }), true);
    }
}))

interface ProjectState {
    project: Project;
    isPushing: boolean,
    isRunning: boolean,
    podStatus: PodStatus,
    operation: "create" | "select" | "delete" | "none" | "copy";
    setProject: (project: Project, operation:  "create" | "select" | "delete"| "none" | "copy") => void;
    setOperation: (o: "create" | "select" | "delete"| "none" | "copy") => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
    project: new Project(),
    operation: "none",
    isPushing: false,
    isRunning: false,
    podStatus: new PodStatus(),
    setProject: (p: Project) => {
        set((state: ProjectState) => ({
            project: p
        }), true);
    },
    setOperation: (o: "create" | "select" | "delete"| "none" | "copy") => {
        set((state: ProjectState) => ({
            operation: o
        }), true);
    },
}))

interface FilesState {
    files: ProjectFile[];
    setFiles: (files: ProjectFile[]) => void;
    upsertFile: (file: ProjectFile) => void;
}

export const useFilesStore = create<FilesState>((set) => ({
    files: [],
    setFiles: (files: ProjectFile[]) => {
        set((state: FilesState) => ({
            files: files
        }), true);
    },
    upsertFile: (file: ProjectFile) => {
        set((state: FilesState) => ({
            files: state.files.find(f => f.name === file.name) === undefined
                ? [...state.files, file]
                : [...state.files.filter(f => f.name !== file.name), file]
        }), true);
    }
}))

interface FileState {
    file?: ProjectFile;
    operation: "create" | "select" | "delete" | "none" | "copy" | "upload";
    setFile: (file: ProjectFile, operation:  "create" | "select" | "delete"| "none" | "copy" | "upload") => void;
}

export const useFileStore = create<FileState>((set) => ({
    file: undefined,
    operation: "none",
    setFile: (file: ProjectFile, operation:  "create" | "select" | "delete"| "none" | "copy" | "upload") => {
        set((state: FileState) => ({
            file: file,
            operation: operation
        }), true);
    },
}))

interface DeploymentStatusesState {
    statuses: DeploymentStatus[];
    setDeploymentStatuses: (statuses: DeploymentStatus[]) => void;
}

export const useDeploymentStatusesStore = create<DeploymentStatusesState>((set) => ({
    statuses: [],
    setDeploymentStatuses: (statuses: DeploymentStatus[]) => {
        set((state: DeploymentStatusesState) => ({
            statuses: statuses
        }), true);
    },
}))


interface RunnerState {
    podName?: string,
    status: "none" | "starting" | "deleting"| "reloading" | "running",
    setStatus: (status: "none" | "starting" | "deleting"| "reloading" | "running") => void,
    type: 'container' | 'pipeline' | 'none',
    setType: (type: 'container' | 'pipeline' | 'none') => void,
    showLog: boolean,
    setShowLog: (showLog: boolean) => void;
}

export const useRunnerStore = create<RunnerState>((set) => ({
    podName: undefined,
    status: "none",
    setStatus: (status: "none" | "starting" | "deleting"| "reloading" | "running") =>  {
        set((state: RunnerState) => ({
            status: status,
        }), true);
    },
    type: "none",
    setType: (type: 'container' | 'pipeline' | 'none') =>  {
        set((state: RunnerState) => ({type: type}), true);
    },
    showLog: false,
    setShowLog: (showLog: boolean) => {
        set(() => ({showLog: showLog}));
    }
}))

interface LogState {
    data: string;
    setData: (data: string) => void;
    addData: (data: string) => void;
    addDataAsync: (data: string) => void;
    currentLine: number;
    setCurrentLine: (currentLine: number) => void;
}

export const useLogStore = create<LogState>((set) => ({
    data: '',
    setData: (data: string)  => {
        set({data: data}, true)
    },
    addData: (data: string)  => {
        set((state: LogState) => ({data: state.data.concat('\n').concat(data)}), true)
    },
    addDataAsync: async (data: string) => {
        set((state: LogState) => ({data: state.data.concat('\n').concat(data)}), true)
    },
    currentLine: 0,
    setCurrentLine: (currentLine: number)  => {
        set((state: LogState) => ({currentLine: currentLine}), true)
    }
}))

console.log("Start log subscriber");
const sub = ProjectEventBus.onLog()?.subscribe((result: ["add" | "set", string]) => {
    if (result[0] === 'add') {
        unstable_batchedUpdates(() => {
            useLogStore.setState((state: LogState) =>
                ({data: state.data ? state.data.concat('\n').concat(result[1]) : result[1], currentLine: state.currentLine+1}), true)
        })
    }
    else if (result[0] === 'set') {
        unstable_batchedUpdates(() => {
            useLogStore.setState({data: result[1], currentLine: 0});
        })
    }
});
