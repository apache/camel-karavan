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
import {
    AppConfig,
    CamelStatus,
    ContainerImage,
    DeploymentStatus,
    DesignerTab,
    FileOperation,
    Project,
    ProjectCommited,
    ProjectFile,
    ProjectFileCommited,
    ProjectOperation,
    ServiceStatus
} from "@models/ProjectModels";
import {createWithEqualityFn} from "zustand/traditional";
import {shallow} from "zustand/shallow";
import isEqual from "lodash/isEqual";

interface AppConfigState {
    loading: boolean;
    setLoading: (loading: boolean) => void;
    config: AppConfig;
    setConfig: (config: AppConfig) => void;
    selectedEnv: string[];
    setSelectedEnv: (selectedEnv: string[]) => void;
    selectEnvironment: (name: string, selected: boolean) => void;
    dockerInfo: any;
    setDockerInfo: (info: any) => void;
}

export const useAppConfigStore = createWithEqualityFn<AppConfigState>((set) => ({
    loading: false,
    setLoading: (loading: boolean) => {
        set({loading: loading})
    },
    config: new AppConfig(),
    setConfig: (config: AppConfig) => {
        set({config: config})
    },
    selectedEnv: [],
    setSelectedEnv: (selectedEnv: string[]) => {
        set((state: AppConfigState) => {
            state.selectedEnv.length = 0;
            state.selectedEnv.push(...selectedEnv);
            return {selectedEnv: state.selectedEnv};
        });
    },
    selectEnvironment(name: string, selected: boolean) {
        set((state: AppConfigState) => {
            if (selected && !state.selectedEnv.includes(name)) {
                state.selectedEnv.push(name);
            } else if (!selected && state.selectedEnv.includes(name)) {
                const filtered = state.selectedEnv.filter(e => e !== name);
                state.selectedEnv.length = 0;
                state.selectedEnv.push(...filtered);
            }
            return {selectedEnv: state.selectedEnv};
        });
    },
    dockerInfo: {},
    setDockerInfo: (info: any)  => {
        set({
            dockerInfo: info
        })
    },
}), shallow)


interface ProjectsState {
    projects: Project[];
    projectsCommited: ProjectCommited[];
    setProjects: (projects: Project[]) => void;
    upsertProject: (project: Project) => void;
    filter: string;
    setFilter: (filter: string) => void;
    labels: any;
    setLabels: (labels: any) => void;
}

export const useProjectsStore = createWithEqualityFn<ProjectsState>((set, get) => ({
    projects: [],
    projectsCommited: [],
    labels: {},
    setProjects: (ps: Project[]) => {
        set((state: ProjectsState) => ({
            projects: ps,
        }));
    },
    setLabels: (labels: any) => {
        set({labels: labels});
    },
    upsertProject: (project: Project) => {
        set((state: ProjectsState) => ({
            projects: state.projects.find(f => f.projectId === project.projectId) === undefined
                ? [...state.projects, project]
                : [...state.projects.filter(f => f.projectId !== project.projectId), project]
        }));
    },
    filter: '',
    setFilter: (filter: string) => {
        set({filter: filter});
    }
}), shallow)


export const ProjectMenus = ['topology', 'source', 'readme', 'build', 'containers'] as const;
export const ProjectRuntimeMenus = ['pod', 'log'] as const;
export type ProjectMenu = typeof ProjectMenus[number];
export type ProjectRuntimeMenu = typeof ProjectRuntimeMenus[number];

interface ProjectState {
    project: Project;
    setProject: (project: Project, operation: ProjectOperation) => void;
    operation: "create" | "select" | "delete" | "none" | "copy";
    tabIndex: ProjectMenu | ProjectRuntimeMenu;
    setTabIndex: (tabIndex: ProjectMenu | ProjectRuntimeMenu | number) => void;
    setOperation: (o: ProjectOperation) => void;
}

export const useProjectStore = createWithEqualityFn<ProjectState>((set) => ({
    project: new Project(),
    operation: 'none',
    tabIndex: 'topology',
    setProject: (project: Project, operation: ProjectOperation) => {
        set((state: ProjectState) => ({
            project: project,
            operation: operation,
            refreshTrace: false,
            jvm: {},
            context: {},
            trace: {},
            memory: {},
            tabIndex: state.tabIndex
        }));
    },
    setOperation: (o: ProjectOperation) => {
        set((state: ProjectState) => ({
            operation: o
        }));
    },
    setTabIndex: (tabIndex: ProjectMenu | ProjectRuntimeMenu | number) => {
        const tab = typeof tabIndex === 'number' ? ProjectMenus[tabIndex] : tabIndex;
        set({tabIndex: tab});
    },
    
}), shallow)


export type FilesSideBarType = 'create' | 'upload' | 'library'

interface FilesState {
    files: ProjectFile[];
    commitedFiles: ProjectFileCommited[];
    diff: any;
    setFiles: (files: ProjectFile[]) => void;
    upsertFile: (file: ProjectFile) => void;
    selectedFileNames: string[];
    setSelectedFileNames: (selectedFileNames: string[]) => void;
    selectFile: (filename: string) => void;
    unselectFile: (filename: string) => void;
}

export const useFilesStore = createWithEqualityFn<FilesState>((set, get) => ({
    files: [],
    commitedFiles: [],
    diff: {},
    selectedFileNames: [],
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
    },
    setSelectedFileNames: (selectedFileNames: string[]) => {
        set((state: FilesState) => ({
            selectedFileNames: selectedFileNames
        }));
    },
    selectFile: (filename: string) => {
        set((state: FilesState) => {
            const names = [...state.selectedFileNames];
            if (!state.selectedFileNames.includes(filename)) {
                names.push(filename);
            }
            return ({selectedFileNames: names})
        });
    },
    unselectFile: (filename: string) => {
        set((state: FilesState) => {
            const names = [...state.selectedFileNames.filter(f => f !== filename)];
            return ({selectedFileNames: names})
        });
    }
}), shallow)

interface FileState {
    file?: ProjectFile;
    operation: FileOperation;
    designerTab?: DesignerTab;
    setFile: (operation: FileOperation, file?: ProjectFile, designerTab?: DesignerTab) => void;
}

export const useFileStore = createWithEqualityFn<FileState>((set) => ({
    file: undefined,
    operation: "none",
    designerTab: undefined,
    addProperty: '',
    setFile: (operation: FileOperation, file?: ProjectFile, designerTab?: DesignerTab) => {
        set((state: FileState) => ({
            file: file,
            operation: operation,
            designerTab: designerTab
        }));
    },
}), shallow)

interface WizardState {
    showWizard: boolean;
    setShowWizard: (showWizard: boolean) => void;
}

export const useWizardStore = createWithEqualityFn<WizardState>((set) => ({
    showWizard: false,
    setShowWizard: (showWizard: boolean) => {
        set({showWizard: showWizard})
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
    setStatus: (status: "none" | "wip") => {
        set((state: DevModeState) => ({
            status: status,
        }));
    },
    setPodName: (podName?: string) => {
        set((state: DevModeState) => ({
            podName: podName,
        }));
    },
}), shallow)

interface StatusesState {
    deployments: DeploymentStatus[];
    services: ServiceStatus[];
    camelContexts: CamelStatus[];
    routes: CamelStatus[];
    setRoutes: (routes: CamelStatus[]) => void;
    consumers: CamelStatus[];
    setConsumers: (consumers: CamelStatus[]) => void;
    processors: CamelStatus[];
    setProcessors: (processors: CamelStatus[]) => void;
    setDeployments: (d: DeploymentStatus[]) => void;
    setServices: (s: ServiceStatus[]) => void;
    setCamelContexts: (camelContexts: CamelStatus[]) => void;
    camels: CamelStatus[];
    setCamels: (c: CamelStatus[]) => void;
}

export const useStatusesStore = createWithEqualityFn<StatusesState>((set, get) => ({
    deployments: [],
    services: [],
    camelContexts: [],
    routes: [],
    consumers: [],
    processors: [],
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
    setCamelContexts: (c: CamelStatus[]) => {
        set((state: StatusesState) => ({
            camelContexts: c,
        }));
    },
    setRoutes: (routes: CamelStatus[]) => {
        set((state: StatusesState) => ({
            routes: routes,
        }));
    },
    setConsumers: (consumers: CamelStatus[]) => {
        set({consumers})
    },
    setProcessors: (processors: CamelStatus[]) => {
        set({processors})
    },
    camels: [],
    setCamels: (c: CamelStatus[]) => {
        set((state: StatusesState) => ({
            camels: c,
        }));
    },
}), shallow)


interface SelectedContainerState {
    selectedContainerName?: string;
    setSelectedContainerName: (selectedContainerName?: string) => void;
}

export const useSelectedContainerStore = createWithEqualityFn<SelectedContainerState>((set) => ({
    setSelectedContainerName: (selectedContainerName?: string)  => {
        set({selectedContainerName: selectedContainerName })
    },
}), shallow)
