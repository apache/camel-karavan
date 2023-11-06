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

import axios, {AxiosResponse } from "axios";
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
import {EventStreamContentType, fetchEventSource} from "@microsoft/fetch-event-source";
import {ProjectEventBus} from "./ProjectEventBus";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = axios.create();

export class KaravanApi {

    static me?: any;
    static basicToken: string = '';
    static authType?: string = undefined;
    static isAuthorized: boolean = false;

    static setAuthType(authType: string) {
        KaravanApi.authType = authType;
        switch (authType){
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
            console.log(err.message);
            after(undefined);
        });
    }

    static async getConfig(after: (config: {}) => void) {
        axios.get('/public/sso-config', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getAuthType(after: (authType: string) => void) {
        instance.get('/public/auth', {headers: {'Accept': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    KaravanApi.setAuthType(res.data);
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async auth(username: string, password: string, after: (res: any) => void) {
        KaravanApi.basicToken = Buffer.from(username + ":" + password).toString('base64');
        instance.get('/api/users/me')
            .then(res => {
                if (res.status === 200) {
                    KaravanApi.isAuthorized = true;
                    KaravanApi.me = res.data;
                    after(res);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getMe(after: (user: {}) => void) {
        instance.get('/api/users/me')
            .then(res => {
                if (res.status === 200) {
                    KaravanApi.me = res.data;
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getConfiguration(after: (config: AppConfig) => void) {
        instance.get('/api/configuration')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getProject(projectId: string, after: (project: Project) => void) {
        instance.get('/api/project/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getProjectDeploymentStatus(projectId: string, env: string, after: (status?: DeploymentStatus) => void) {
        instance.get('/api/status/deployment/' + projectId + "/" + env)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else if (res.status === 204){
                    after(undefined);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getProjectCamelStatus(projectId: string, env: string, after: (status: CamelStatus) => void) {
        instance.get('/api/status/camel/' + projectId + "/" + env)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getAllCamelContextStatuses(after: (statuses: CamelStatus[]) => void) {
        instance.get('/api/status/camel/context')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getProjects(after: (projects: Project[]) => void, type?: ProjectType.normal) {
        instance.get('/api/project' + (type !== undefined ? "?type=" + type : ""))
            .then(res => {
                if (res.status === 200) {
                    after(res.data.map((p: Partial<Project> | undefined) => new Project(p)));
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async postProject(project: Project, after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/project', project)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async copyProject(sourceProject: string, project: Project, after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/project/copy/' + sourceProject, project)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteProject(project: Project, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/api/project/' + encodeURI(project.projectId),
            {headers: {'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async buildProject(project: Project, tag: string, after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/project/build/' + tag, project)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getFiles(projectId: string, after: (files: ProjectFile[]) => void) {
        instance.get('/api/file/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async postProjectFile(file: ProjectFile, after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/file', file)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteProjectFile(file: ProjectFile, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/api/file/' + file.projectId + '/' + file.name)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async push(params: {}, after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/git', params)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async pull(projectId: string, after: (res: AxiosResponse<any>) => void) {
        instance.get('/api/git/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getTemplatesFiles( after: (files: []) => void) {
        instance.get('/api/file/templates')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getDevModePodStatus(projectId: string, after: (res: AxiosResponse<ContainerStatus>) => void) {
        instance.get('/api/devmode/container/' + projectId)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async reloadDevModeCode(projectId: string, after: (res: AxiosResponse<any>) => void) {
        instance.get('/api/devmode/reload/' + projectId)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getProjectCamelStatuses(projectId: string, env: string, after: (res: AxiosResponse<CamelStatus[]>) => void) {
        instance.get('/api/project/status/camel/' + projectId + "/" + env)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getProjectCamelTraces(projectId: string, env: string, after: (res: AxiosResponse<CamelStatus[]>) => void) {
        instance.get('/api/project/traces/' + projectId + "/" + env)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async startDevModeContainer(project: Project, verbose: boolean, after: (res: AxiosResponse<string>) => void) {
        instance.post('/api/devmode' + (verbose ? '/--verbose' : ''), project)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteDevModeContainer(name: string, deletePVC: boolean, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/api/devmode/' +  name + "/" + deletePVC)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async setProjectImage(projectId: string, imageName: string, commit: boolean, message: string, after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/image/' + projectId, {imageName: imageName, commit: commit, message: message})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async stopBuild(environment: string, buildName: string, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/api/project/build/' + environment + "/" + buildName)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getContainerLog(environment: string, name: string, after: (res: AxiosResponse<string>) => void) {
        instance.get('/api/container/log/' + environment + "/" + name)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getAllServiceStatuses(after: (statuses: ServiceStatus[]) => void) {
        instance.get('/api/infrastructure/service')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getAllContainerStatuses(after: (statuses: ContainerStatus[]) => void) {
        instance.get('/api/container')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getAllDeploymentStatuses(after: (statuses: DeploymentStatus[]) => void) {
        instance.get('/api/infrastructure/deployment')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getDeploymentStatuses(env: string, after: (statuses: DeploymentStatus[]) => void) {
        instance.get('/api/infrastructure/deployment/' + env)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async rolloutDeployment(name: string, environment: string, after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/infrastructure/deployment/rollout/' + environment + '/' + name, "")
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteDeployment(environment: string, name: string, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/api/infrastructure/deployment/' + environment + '/' + name)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async manageContainer(environment: string,
                                 type: 'devmode' | 'devservice' | 'project' | 'internal' | 'build' | 'unknown',
                                 name: string,
                                 command: 'run' | 'pause' | 'stop' | 'delete',
                                 after: (res: AxiosResponse<any>) => void) {
        instance.post('/api/container/' + environment + '/' + type + "/" + name, {command: command})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async deleteContainer(environment: string, type: 'devmode' | 'devservice' | 'project' | 'internal' | 'build' | 'unknown', name: string, after: (res: AxiosResponse<any>) => void) {
        instance.delete('/api/container/' + environment + '/' + type + "/" + name)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async getConfigMaps(after: (any: []) => void) {
        instance.get('/api/infrastructure/configmaps/')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getImages(projectId: string, after: (string: []) => void) {
        instance.get('/api/image/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async deleteImage(imageName: string, after: () => void) {
        instance.delete('/api/image/' + Buffer.from(imageName).toString('base64'))
            .then(res => {
                if (res.status === 200) {
                    after();
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getSecrets(after: (any: []) => void) {
        instance.get('/api/infrastructure/secrets')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getServices(after: (any: []) => void) {
        instance.get('/api/infrastructure/services')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }


    static async getKamelets(after: (yaml: string) => void) {
        instance.get('/api/kamelet', {headers: {'Accept': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getCustomKameletNames(after: (names: []) => void) {
        instance.get('/api/kamelet/names')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getComponents(after: (json: string) => void) {
        instance.get('/api/component')
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getSupportedComponents(after: (json: string) => void) {
        instance.get('/api/supported-component')
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getOpenApis(after: (openapis: []) => void) {
        instance.get('/api/openapi')
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    }

    static async getOpenApi(name: string, after: (res: AxiosResponse<any>) => void) {
        instance.get('/api/openapi/' + name, {headers: {'Accept': 'text/plain'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async postOpenApi(file: ProjectFile, generateRest: boolean, generateRoutes: boolean, integrationName: string, after: (res: AxiosResponse<any>) => void) {
        const uri = `/api/file/openapi/${generateRest}/${generateRoutes}/${integrationName}`;
        instance.post(encodeURI(uri), file)
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    }

    static async fetchData(type: 'container' | 'build' | 'none', podName: string, controller: AbortController) {
        const fetchData = async () => {
            await fetchEventSource("/api/logwatch/" + type + "/" + podName, {
                method: "GET",
                headers: {
                    Accept: "text/event-stream",
                },
                signal: controller.signal,
                async onopen(response) {
                    if (response.ok && response.headers.get('content-type') === EventStreamContentType) {
                        return; // everything's good
                    } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
                        // client-side errors are usually non-retriable:
                        console.log("Server side error ", response);
                    } else {
                        console.log("Error ", response);
                    }
                },
                onmessage(event) {
                    ProjectEventBus.sendLog('add', event.data);
                },
                onclose() {
                    console.log("Connection closed by the server");
                },
                onerror(err) {
                    console.log("There was an error from server", err);
                },
            });
        };
        return fetchData();
    }
}

