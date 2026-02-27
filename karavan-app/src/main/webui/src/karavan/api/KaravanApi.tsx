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

import axios, {AxiosResponse} from "axios";
import {
    AppConfig,
    CamelStatus,
    CamelStatusName,
    ContainerStatus,
    DeploymentStatus,
    PodEvent,
    Project,
    ProjectCommited,
    ProjectFile,
    ProjectFileCommited,
    ProjectType,
    ServiceStatus
} from "@models/ProjectModels";
import {Buffer} from 'buffer';
import {EventBus} from "@features/project/designer/utils/EventBus";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {AuthApi, getCurrentUser} from "@api/auth/AuthApi";

const instance = AuthApi.getInstance();

export class KaravanApi {

    static async getReadiness(after: (readiness: any) => void): Promise<void> {
        axios.get('/public/readiness', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after(undefined);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }
    
    static async getConfiguration(after: (config: AppConfig) => void) {
        instance.get('/ui/configuration')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getInfrastructureInfo(after: (info: any) => void) {
        instance.get('/ui/configuration/info')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getProject(projectId: string, after: (project: Project) => void) {
        instance.get('/ui/project/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getAllCamelStatuses(name: CamelStatusName | null, after: (statuses: CamelStatus[]) => void) {
        instance.get(`/ui/status/camel/${name || ''}`)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getProjects(after: (projects: Project[]) => void, type?: ProjectType.integration) {
        instance.get('/ui/project' + (type !== undefined ? "?type=" + type : ""))
            .then(res => {
                if (res.status === 200) {
                    after(res.data.map((p: Partial<Project> | undefined) => new Project(p)));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }
    static async getProjectsCommited(after: (projects: ProjectCommited[]) => void) {
        instance.get('/ui/project/commited/all')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async postProject(project: Project, after: (result: boolean, res: AxiosResponse<Project> | any) => void) {
        try {
            instance.post('/ui/project', project)
                .then(res => {
                    if (res.status === 200) {
                        after(true, res);
                    }
                }).catch(err => {
                console.error(err);
                after(false, err);
                EventBus.sendAlert("Error", err?.message, "danger")
            });
        } catch (error: any) {
            console.error(error);
            after(false, error);
            EventBus.sendAlert("Error", error?.message, "danger")
        }
    }

    static copyProject(sourceProject: string, project: Project, after: (result: boolean, res: AxiosResponse<Project> | any) => void) {
        try {
            instance.post('/ui/project/copy/' + sourceProject, project)
                .then(res => {
                    if (res.status === 200) {
                        after(true, res);
                    }
                }).catch(err => {
                after(false, err);
            });
        } catch (error: any) {
            after(false, error);
        }
    }

    static async deleteProject(project: Project, deleteContainers: boolean, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/ui/project/' + encodeURI(project.projectId) + (deleteContainers ? '?deleteContainers=true' : ''))
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async buildProject(project: Project, tag: string, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/project/build/' + tag, project)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async shareConfigurationFile(filename: string, after: (res: AxiosResponse<any>) => void) {
        await KaravanApi.shareConfigurations(after, filename);
    }

    static async shareConfigurations(after: (res: AxiosResponse<any>) => void, filename?: string,) {
        const params = {
            'filename': filename,
            'userId': getCurrentUser()?.username
        };
        instance.post('/ui/configuration/share/', params)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch((err: any) => {
            ErrorEventBus.sendApiError(err);
            const data = err.response?.data
            const message = typeof data === 'string' ? data : err.message;
            EventBus.sendAlert("Error", message, "danger")
        });
    }

    static async getFiles(projectId: string, after: (files: ProjectFile[]) => void) {
        instance.get(`/ui/file/${projectId}`)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }
    static async getCommitedFiles(projectId: string, after: (files: ProjectFileCommited[]) => void) {
        instance.get(`/ui/file/commited/${projectId}`)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async loadProjectCommits(projectId: string, after: (res: any) => void) {
        instance.post(`/ui/git/commits/${projectId}`)
            .then(res => {
                if (res.status === 202) {
                    after(res);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getSystemCommits(after: (res: any) => void) {
        instance.get(`/ui/git/system`)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getProjectFilesByName(projectId: string, filename: string, after: (files: ProjectFile) => void) {
        instance.get(`/ui/file/${projectId}?filename=${filename}`)
            .then(res => {
                if (res.status === 200 && res.data !== undefined) {
                    after(res.data?.at(0));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getFilesByName(filename: string, after: (files: ProjectFile[]) => void) {
        instance.get(`/ui/file?filename=${filename}`)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getFileCommited(projectId: string, filename: string, after: (file: ProjectFile) => void) {
        instance.get('/ui/file/commited/' + projectId + '/' + filename)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getFilesDiff(projectId: string, after: (diff: any) => void) {
        instance.get('/ui/file/diff/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async saveProjectFile(file: ProjectFile, after: (result: boolean, file: ProjectFile | any) => void) {
        try {
            instance.post('/ui/file', file)
                .then(res => {
                    if (res.status === 200) {
                        after(true, res.data);
                    } else {
                        after(false, res?.data);
                    }
                }).catch(err => {
                    console.error(err);
                after(false, err);
            });
        } catch (error: any) {
            console.error(error);
            after(false, error);
        }
    }

    static async renameProjectFile(projectId: string, filename: string, newName: string, after: (result: boolean, err?: Error) => void) {
        try {
            instance.patch(`/ui/file/${projectId}/${filename}`, {newName: newName})
                .then(res => {
                    if (res.status === 200) {
                        after(true);
                    } else if (res.status === 409) {
                        after(false, {message: res?.data} as Error);
                    } else {
                        after(false);
                    }
                }).catch(err => {
                after(false, err);
            });
        } catch (error: any) {
            after(false, error);
        }
    }

    static async putProjectFile(file: ProjectFile, after: (res: AxiosResponse<any>) => void) {
        instance.put('/ui/file', file)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteProjectFile(file: ProjectFile, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/ui/file/' + file.projectId + '/' + file.name)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async copyProjectFile(fromProjectId: string, fromFilename: string, toProjectId: string, toFilename: string, overwrite: boolean, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/file/copy', {fromProjectId: fromProjectId, fromFilename: fromFilename, toProjectId: toProjectId, toFilename: toFilename, overwrite: overwrite})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async push(params: {}, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/git', params)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async pull(projectId: string | undefined, after: (res: AxiosResponse<any> | any) => void) {
        instance.put(`/ui/git/${projectId ?? ''}`)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }


    static async reloadDevModeCode(projectId: string, after: (res: AxiosResponse<any>) => void) {
        instance.get('/ui/devmode/reload/' + projectId)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getProjectCamelStatuses(projectId: string, env: string, after: (res: AxiosResponse<CamelStatus[]>) => void) {
        instance.get('/ui/project/status/camel/' + projectId + "/" + env)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getProjectCamelTraces(projectId: string, env: string, after: (res: AxiosResponse<CamelStatus[]>) => void) {
        instance.get('/ui/project/traces/' + projectId + "/" + env)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async startDevModeContainer(projectId: string, verbose: boolean, compile: boolean, after: (res: AxiosResponse<any>) => void) {
        instance.get(`/ui/devmode/run/${projectId}/${verbose.toString()}/${compile.toString()}`)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteDevModeContainer(name: string, deletePVC: boolean, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/ui/devmode/' + name + "/" + deletePVC)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }



    static async stopBuild(environment: string, buildName: string, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/ui/project/build/' + environment + "/" + buildName)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getContainerLog(environment: string, name: string, after: (res: AxiosResponse<string>) => void) {
        instance.get('/ui/container/log/' + environment + "/" + name)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getAllServiceStatuses(after: (statuses: ServiceStatus[]) => void) {
        instance.get('/ui/infrastructure/service')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getAllContainerStatuses(after: (statuses: ContainerStatus[]) => void) {
        instance.get('/ui/container')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getContainerStatus(projectId: string, env: string, after: (res: AxiosResponse<ContainerStatus[]>) => void) {
        instance.get('/ui/container/' + projectId + "/" + env)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getAllDeploymentStatuses(after: (statuses: DeploymentStatus[]) => void) {
        instance.get('/ui/infrastructure/deployment')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getDeploymentStatuses(env: string, after: (statuses: DeploymentStatus[]) => void) {
        instance.get('/ui/infrastructure/deployment/' + env)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async rolloutDeployment(projectId: string, environment: string, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/infrastructure/deployment/rollout/' + environment + '/' + projectId, "")
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async startDeployment(projectId: string, environment: string, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/infrastructure/deployment/start/' + environment + '/' + projectId, "")
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteDeployment(environment: string, name: string, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/ui/infrastructure/deployment/' + environment + '/' + name)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getPodEvents(containerName: string, after: (podEvents: PodEvent[]) => void) {
        instance.get('/ui/infrastructure/pod-events/' + containerName, {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after([]);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }

    static async manageContainer(projectId: string,
                                 type: 'devmode' | 'packaged' | 'internal' | 'build' | 'unknown',
                                 name: string,
                                 command: 'deploy' | 'run' | 'pause' | 'stop' | 'delete',
                                 pullImage: 'always' | 'ifNotExists' | 'never',
                                 after: (res: AxiosResponse<any> | any) => void) {
        instance.post('/ui/container/' + projectId + '/' + type + "/" + name, {command: command, pullImage: pullImage})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteContainer(projectId: string, type: 'devmode' | 'packaged' | 'internal' | 'build' | 'unknown', name: string, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/ui/container/' + projectId + '/' + type + "/" + name)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getConfigMaps(after: (any: []) => void) {
        instance.get('/ui/infrastructure/configmaps/')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getImages(projectId: string, after: (string: []) => void) {
        instance.get('/ui/image/project/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async setProjectImage(projectId: string, imageName: string, commit: boolean, message: string, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/image/project/' + projectId, {imageName: imageName, commit: commit, message: message})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteImage(imageName: string, after: () => void) {
        instance.delete('/ui/image/project/' + Buffer.from(imageName).toString('base64'))
            .then(res => {
                if (res.status === 200) {
                    after();
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async pullProjectImages(projectId: string, after: (res: AxiosResponse<any>) => void) {
        const params = {
            'projectId': projectId,
            'userId': getCurrentUser()?.username
        };
        instance.post('/ui/image/pull/', params)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getSecrets(after: (any: []) => void) {
        instance.get('/ui/infrastructure/secrets')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getServices(after: (any: []) => void) {
        instance.get('/ui/infrastructure/services')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async deleteAllStatuses(after: (res: AxiosResponse<any>) => void) {
        instance.delete('/ui/status/all/')
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async restartInformers(after: (res: AxiosResponse<any>) => void) {
        instance.put('/ui/infrastructure/informers/')
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getCamelKamelets(after: (yaml: string) => void) {
        instance.get('/ui/metadata/kamelets', {headers: {'Accept': 'text/plain'}, timeout: 0})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getProjectKamelets(projectId: string, after: (yaml: string) => void) {
        instance.get('/ui/metadata/kamelets/' + projectId, {headers: {'Accept': 'text/plain'}, timeout: 0})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getCustomKamelets(after: (yaml: string) => void) {
        instance.get('/ui/metadata/kamelets/kamelets', {headers: {'Accept': 'text/plain'}, timeout: 0})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getComponents(after: (json: string) => void) {
        instance.get('/ui/metadata/components', {timeout: 0})
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getBeans(after: (json: string) => void) {
        instance.get('/ui/metadata/beans', {timeout: 0})
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getMetadataConfiguration(configName: string, after: (json: string) => void) {
        instance.get(`/ui/metadata/${configName}Configuration`, { timeout: 0 })
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getConfigurationChanges(after: (json: string) => void) {
        instance.get('/ui/metadata/configurationChanges', {timeout: 0})
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getProjectsActivities(after: (activities?: any) => void) {
        instance.get('/ui/activity/projects')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after(undefined);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after(undefined);
        });
    }

    static async getUsersActivities(after: (activities?: any) => void) {
        instance.get('/ui/activity/users')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after(undefined);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after(undefined);
        });
    }

    static async getProjectsLabels(after: (labels?: any) => void) {
        instance.get('/ui/labels')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after(undefined);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after(undefined);
        });
    }
}
