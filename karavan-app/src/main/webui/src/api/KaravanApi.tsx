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
    DeploymentStatus,
    ContainerStatus,
    Project,
    ProjectFile, ProjectType, ServiceStatus
} from "./ProjectModels";
import {Buffer} from 'buffer';
import {SsoApi} from "./SsoApi";
import {v4 as uuidv4} from "uuid";
import {useAppConfigStore} from "./ProjectStore";
import {EventBus} from "../designer/utils/EventBus";
import {ErrorEventBus} from "./ErrorEventBus";

const USER_ID_KEY = 'KARAVAN_USER_ID';
axios.defaults.timeout = 5000;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = axios.create();

export class KaravanApi {

    static me?: any;
    static authType?: string = undefined;
    static basicToken: string = '';

    static getInstance() {
        return instance;
    }

    static getUserId(): string {
        if (KaravanApi.authType === 'public') {
            const userId = localStorage.getItem(USER_ID_KEY);
            if (userId !== null && userId !== undefined) {
                return userId;
            } else {
                const newId = uuidv4().toString();
                localStorage.setItem(USER_ID_KEY, newId);
                return newId;
            }
        } else {
            return KaravanApi.me?.userName;
        }
    }

    static setAuthType(authType: string) {
        KaravanApi.authType = authType;
        switch (authType) {
            case "public": {
                KaravanApi.setPublicAuthentication();
                break;
            }
            case "oidc": {
                KaravanApi.setOidcAuthentication();
                break;
            }
            case "basic": {
                KaravanApi.setBasicAuthentication();
                break;
            }
        }
    }

    static setPublicAuthentication() {

    }

    static setBasicAuthentication() {
        instance.interceptors.request.use(async config => {
                config.headers.Authorization = 'Basic ' + KaravanApi.basicToken;
                return config;
            },
            error => {
                Promise.reject(error)
            });
    }

    static setOidcAuthentication() {
        instance.interceptors.request.use(async config => {
                config.headers.Authorization = 'Bearer ' + SsoApi.keycloak?.token;
                return config;
            },
            error => {
                Promise.reject(error)
            });

        instance.interceptors.response.use((response) => {
            return response
        }, async function (error) {
            const originalRequest = error.config;
            if ((error?.response?.status === 403 || error?.response?.status === 401) && !originalRequest._retry) {
                console.log("error", error)
                return SsoApi.keycloak?.updateToken(30).then(refreshed => {
                    if (refreshed) {
                        console.log('SsoApi', 'Token was successfully refreshed');
                    } else {
                        console.log('SsoApi', 'Token is still valid');
                    }
                    originalRequest._retry = true;
                    return instance(originalRequest);
                }).catch(reason => {
                    console.log('SsoApi', 'Failed to refresh token: ' + reason);
                });
            }
            return Promise.reject(error);
        });
    }

    static async getReadiness(after: (readiness: any) => void) {
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

    static async getConfig(after: (config: {}) => void) {
        axios.get('/public/sso-config', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getAuthType(after: (authType: string) => void) {
        instance.get('/public/auth', {headers: {'Accept': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    const authType = res.data;
                    KaravanApi.setAuthType(authType);
                    useAppConfigStore.setState({isAuthorized: authType === 'public'})
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getMe(after: (user: {}) => void) {
        instance.get('/ui/users/me')
            .then(res => {
                if (res.status === 200) {
                    KaravanApi.me = res.data;
                    after(res.data);
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

    static async getProjectDeploymentStatus(projectId: string, env: string, after: (status?: DeploymentStatus) => void) {
        instance.get('/ui/status/deployment/' + projectId + "/" + env)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else if (res.status === 204) {
                    after(undefined);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getProjectCamelStatus(projectId: string, env: string, after: (status: CamelStatus) => void) {
        instance.get('/ui/status/camel/' + projectId + "/" + env)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getAllCamelContextStatuses(after: (statuses: CamelStatus[]) => void) {
        instance.get('/ui/status/camel/context')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getProjects(after: (projects: Project[]) => void, type?: ProjectType.normal) {
        instance.get('/ui/project' + (type !== undefined ? "?type=" + type : ""))
            .then(res => {
                if (res.status === 200) {
                    after(res.data.map((p: Partial<Project> | undefined) => new Project(p)));
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
                after(false, err);
            });
        } catch (error: any) {
            after(false, error);
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
            'userId': KaravanApi.getUserId()
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
        instance.get('/ui/file/' + projectId)
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

    static async push(params: {}, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/git', params)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async pull(projectId: string, after: (res: AxiosResponse<any> | any) => void) {
        instance.put('/ui/git/' + projectId)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getConfigurationFiles(after: (files: []) => void) {
        instance.get('/ui/file/configuration')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }


    static async getTemplatesFiles(after: (files: []) => void) {
        instance.get('/ui/file/templates')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getBeanTemplatesFiles(after: (files: ProjectFile []) => void) {
        instance.get('/ui/file/templates/beans')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getDevModePodStatus(projectId: string, after: (res: AxiosResponse<ContainerStatus>) => void) {
        instance.get('/ui/devmode/container/' + projectId)
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

    static async startDevModeContainer(project: Project, verbose: boolean, after: (res: AxiosResponse<any>) => void) {
        instance.post('/ui/devmode' + (verbose ? '/--verbose' : ''), project)
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

    static async manageContainer(projectId: string,
                                 type: 'devmode' | 'devservice' | 'project' | 'internal' | 'build' | 'unknown',
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

    static async deleteContainer(projectId: string, type: 'devmode' | 'devservice' | 'project' | 'internal' | 'build' | 'unknown', name: string, after: (res: AxiosResponse<any>) => void) {
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
            'userId': KaravanApi.getUserId()
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

    static async getKamelets(after: (yaml: string) => void) {
        instance.get('/ui/metadata/kamelets', {headers: {'Accept': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getKameletsForProject(projectId: string, after: (yaml: string) => void) {
        instance.get('/ui/metadata/kamelets/' + projectId, {headers: {'Accept': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getComponents(after: (json: string) => void) {
        instance.get('/ui/metadata/components')
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getBeans(after: (json: string) => void) {
        instance.get('/ui/metadata/beans')
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getMainConfiguration(after: (json: string) => void) {
        instance.get('/ui/metadata/mainConfiguration')
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }
}
