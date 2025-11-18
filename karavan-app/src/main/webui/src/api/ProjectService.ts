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

import {KaravanApi} from './KaravanApi';
import {CamelStatus, ContainerImage, ContainerStatus, DeploymentStatus, Project, ProjectFile, ProjectType, ServiceStatus} from './ProjectModels';
import {TemplateApi} from 'karavan-core/lib/api/TemplateApi';
import {InfrastructureAPI} from '@/integration-designer/utils/InfrastructureAPI';
import {unstable_batchedUpdates} from 'react-dom'
import {useDevModeStore, useFilesStore, useFileStore, useLogStore, useProjectsStore, useProjectStore, useStatusesStore} from './ProjectStore';
import {ProjectEventBus} from './ProjectEventBus';
import {EventBus} from "@/integration-designer/utils/EventBus";
import {KameletApi} from "karavan-core/lib/api/KameletApi";
import {ComponentApi} from 'karavan-core/lib/api/ComponentApi';
import {getCurrentUser} from "@/auth/AuthApi";
import {AxiosResponse} from "axios";
import {ASYNCAPI_FILE_NAME_JSON, JSON_SCHEMA_EXTENSION} from "../../../../../../karavan-core/src/core/contants";

export class ProjectService {

    public static startDevModeContainer(project: Project, verbose: boolean, compile: boolean = false) {
        useDevModeStore.setState({status: 'wip'})
        KaravanApi.startDevModeContainer(project, verbose, compile, res => {
            useDevModeStore.setState({status: 'none'})
            if (res.status === 200 || res.status === 201) {
                ProjectEventBus.sendLog('set', '');
                useLogStore.setState({showLog: true, type: 'container', podName: res.data})
            } else {
                var resData = (res as any)?.response?.data;
                var error = resData?.message ? resData?.message : res.statusText;
                EventBus.sendAlert('Error Starting DevMode container', error, 'warning')
            }
        });
    }

    public static reloadDevModeCode(project: Project) {
        useDevModeStore.setState({status: 'wip'})
        KaravanApi.reloadDevModeCode(project.projectId, res => {
            useDevModeStore.setState({status: 'none'})
            if (res.status === 200 || res.status === 201) {
                // setIsReloadingPod(false);
            } else {
                EventBus.sendAlert('Error Reloading DevMode container', res.statusText, 'warning')
            }
        });
    }

    public static stopDevModeContainer(project: Project) {
        useDevModeStore.setState({status: 'wip'})
        KaravanApi.manageContainer(project.projectId, 'devmode', project.projectId, 'stop', 'never', res => {
            useDevModeStore.setState({status: 'none'})
            if (res.status === 200) {
            } else {
                EventBus.sendAlert('Error stopping DevMode container', res.statusText, 'warning')
            }
        });
    }

    public static pauseDevModeContainer(project: Project) {
        useDevModeStore.setState({status: 'wip'})
        KaravanApi.manageContainer(project.projectId, 'devmode', project.projectId, 'pause', 'never', res => {
            useDevModeStore.setState({status: 'none'})
            if (res.status === 200) {
                useLogStore.setState({showLog: false, type: 'container'})
            } else {
                EventBus.sendAlert('Error stopping DevMode container', res.statusText, 'warning')
            }
        });
    }

    public static deleteDevModeContainer(project: Project) {
        useDevModeStore.setState({status: 'wip'})
        ProjectEventBus.sendLog('set', '');
        KaravanApi.deleteDevModeContainer(project.projectId, false, res => {
            useDevModeStore.setState({status: 'none'})
            if (res.status === 202) {
                useLogStore.setState({showLog: false, type: 'container'})
            } else {
                EventBus.sendAlert('Error delete runner', res.statusText, 'warning')
            }
        });
    }

    public static pushProject(project: Project, commitMessage: string, selectedFileNames: string[]) {
        const params = {
            'projectId': project.projectId,
            'message': commitMessage,
            'userId': getCurrentUser()?.username,
            'fileNames': selectedFileNames.join(","),
        };
        KaravanApi.push(params, res => {
            if (res.status === 200 || res.status === 201) {
                // ProjectService.refreshProject(project.projectId);
                // ProjectService.refreshProjectData(project.projectId);
            } else {
                EventBus.sendAlert("Error pushing", (res as any)?.response?.data, 'danger')
            }
        });
    }

    public static pullProject(projectId: string) {
        useProjectStore.setState({isPulling: true})
        KaravanApi.pull(projectId, res => {
            if (res.status === 200 || res.status === 201) {
                useProjectStore.setState({isPulling: false})
                ProjectService.refreshProject(projectId);
                ProjectService.refreshProjectData(projectId);
            } else {
                EventBus.sendAlert("Error pulling", (res as any)?.response?.data, 'danger')
            }
            useProjectStore.setState({isPulling: false})
        });
    }

    public static pullAllProjects() {
        useProjectStore.setState({isPulling: true})
        KaravanApi.pull(undefined, res => {
            if (res.status === 200 || res.status === 201) {
                useProjectStore.setState({isPulling: false})
                ProjectService.refreshProjects();
            } else {
                EventBus.sendAlert("Error pulling", (res as any)?.response?.data, 'danger')
            }
            useProjectStore.setState({isPulling: false})
        });
    }

    static afterKameletsLoad(yamls: string, saveCamelKamelets: (kameletYamls: string[], clean?: boolean) => void): void {
        try {
            const kamelets: string[] = [];
            yamls.split(/\n?---\n?/).map(c => c.trim()).forEach(z => kamelets.push(z));
            saveCamelKamelets(kamelets, true);
        } catch (e: any) {
            console.error(e);
            EventBus.sendAlert("Error updating kamelets", e?.message, 'danger');
        }
    }

    public static loadCamelAndCustomKamelets() {
        KaravanApi.getCamelKamelets(yaml => ProjectService.afterKameletsLoad(yaml, KameletApi.saveCamelKamelets));
        ProjectService.loadCustomKamelets();
    }

    public static loadCustomKamelets() {
        KaravanApi.getCustomKamelets(yaml => ProjectService.afterKameletsLoad(yaml, KameletApi.saveCustomKamelets));
    }

    public static updateFile(file: ProjectFile, active: boolean, updateFilesStore: boolean = true, after?: (res: AxiosResponse<any>) => void) {
        KaravanApi.putProjectFile(file, res => {
            if (res.status === 200) {
                const newFile = res.data;
                if (updateFilesStore) {
                    useFilesStore.getState().upsertFile(newFile);
                }
                if (active) {
                    useFileStore.setState({file: newFile});
                }
                after?.(res)
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    public static renameFile(projectId: string, oldName: string, newName: string,  after: (res: boolean) => void) {
        KaravanApi.renameProjectFile(projectId, oldName, newName, (result: boolean, err?: Error | undefined) => {
            if (result) {
                after(result);
            } else {
                EventBus.sendAlert("Error", err?.message ?? "Error copying file!", "warning");
            }
        })
    }

    public static refreshProject(projectId: string) {
        KaravanApi.getProject(projectId, (project: Project) => {
            useProjectStore.setState({project: project});
            unstable_batchedUpdates(() => {
                useProjectsStore.getState().upsertProject(project);
            })
        });
    }

    public static refreshProjects() {
        KaravanApi.getProjects((projects: Project[]) => {
            useProjectsStore.setState({projects: projects});
        });
    }

    public static refreshAllContainerStatuses() {
        KaravanApi.getAllContainerStatuses((statuses: ContainerStatus[]) => {
            useStatusesStore.setState({containers: statuses});
        });
    }

    public static refreshContainerStatus(projectId: string, env: string) {
        KaravanApi.getContainerStatus(projectId, env, (res) => {
            if (res.status === 200) {
                const oldContainers = [...useStatusesStore.getState().containers];
                const newContainers = res.data;
                const newMap = new Map<string, ContainerStatus>(
                    newContainers.map(container => [container.containerName, container])
                );
                const containers = oldContainers
                    .filter(container => newMap.has(container.containerName))  // Filter out old containers not in new
                    .map(container => newMap.get(container.containerName)!)     // Replace with new containers
                    .concat(newContainers.filter(container => !oldContainers.some(old => old.containerName === container.containerName)));
                useStatusesStore.setState({containers: containers});
            }
        })
    }

    public static refreshAllServicesStatuses() {
        KaravanApi.getAllServiceStatuses((statuses: ServiceStatus[]) => {
            useStatusesStore.setState({services: statuses});
        });
    }

    public static refreshAllCamelContextStatuses() {
        KaravanApi.getAllCamelStatuses("context",(statuses: CamelStatus[]) => {
            useStatusesStore.setState({camelContexts: statuses});
        });
    }

    public static refreshAllCamelRouteStatuses() {
        KaravanApi.getAllCamelStatuses("route",(statuses: CamelStatus[]) => {
            useStatusesStore.setState({routes: statuses});
        });
    }

    public static refreshAllCamelProcessorStatuses() {
        KaravanApi.getAllCamelStatuses("processor",(statuses: CamelStatus[]) => {
            useStatusesStore.setState({processors: statuses});
        });
    }
    public static refreshAllCamelConsumerStatuses() {
        KaravanApi.getAllCamelStatuses("consumer",(statuses: CamelStatus[]) => {
            useStatusesStore.setState({consumers: statuses});
        });
    }

    public static refreshCamelStatus(projectId: string, env: string) {
        KaravanApi.getProjectCamelStatuses(projectId, env, (res) => {
            if (res.status === 200) {
                useProjectStore.setState({camelStatuses: res.data})
            } else {
                useProjectStore.setState({camelStatuses: []})
            }
        })
    }

    public static refreshCamelTraces(projectId: string, env: string) {
        KaravanApi.getProjectCamelTraces(projectId, env, res => {
            if (res.status === 200) {
                useProjectStore.setState({camelTraces: res.data})
            } else {
                useProjectStore.setState({camelTraces: []})
            }
        })
    }

    public static refreshImages(projectId: string) {
        KaravanApi.getImages(projectId, (res: ContainerImage[]) => {
            useProjectStore.setState({images: res});
        });
    }

    public static refreshAllDeploymentStatuses() {
        KaravanApi.getAllDeploymentStatuses((statuses: DeploymentStatus[]) => {
            useStatusesStore.setState({deployments: statuses});
        });
    }

    public static refreshDeploymentStatuses(environment: string) {
        KaravanApi.getDeploymentStatuses(environment, (statuses: DeploymentStatus[]) => {
            useStatusesStore.setState({deployments: statuses});
        });
    }

    public static deleteProject(project: Project, deleteContainers?: boolean) {
        KaravanApi.deleteProject(project, deleteContainers === true, res => {
            if (res.status === 204) {
                EventBus.sendAlert('Success', 'Project deleted', 'success');
                ProjectService.refreshProjects();
            } else {
                EventBus.sendAlert('Warning', 'Error when deleting project:' + res.statusText, 'warning');
            }
        });
    }

    public static deleteFile(file: ProjectFile) {
        KaravanApi.deleteProjectFile(file, res => {
            if (res.status === 204) {
                ProjectService.refreshProjectData(file.projectId);
            } else {
            }
        });
    }

    public static getAllStatuses() {
        ProjectService.refreshAllDeploymentStatuses();
        ProjectService.refreshAllContainerStatuses();
        ProjectService.refreshAllServicesStatuses();
        ProjectService.refreshAllCamelContextStatuses();
    }

    public static refreshProjectFiles(projectId: string) {
        KaravanApi.getFiles(projectId, (files: ProjectFile[]) => {
            const kameletsYamls = files.filter(f => f.name.endsWith('.kamelet.yaml') && f.code?.length > 0).map(f => f.code).join("\n---\n")
            if (kameletsYamls && kameletsYamls.length > 0) {
                ProjectService.afterKameletsLoad(kameletsYamls, KameletApi.saveProjectKamelets);
            }
            useFilesStore.setState({files: files});
        });

        KaravanApi.getFilesDiff(projectId, (diff: any) => {
            useFilesStore.setState({diff: diff});
        });
    }

    public static refreshProjectData(projectId: string) {
        KaravanApi.getProject(projectId, (project: Project) => {
            // ProjectEventBus.selectProject(project);
            KaravanApi.getTemplatesFiles((files: ProjectFile[]) => {
                files.filter(f => f.name.endsWith('java'))
                    .forEach(f => {
                        const name = f.name.replace(".java", '');
                        TemplateApi.saveTemplate(name, f.code);
                    })
            });
        });
        KaravanApi.getCustomKamelets(yaml => ProjectService.afterKameletsLoad(yaml, KameletApi.saveCustomKamelets));
        ProjectService.refreshProjectFiles(projectId);
        KaravanApi.getConfigMaps((any: []) => InfrastructureAPI.setConfigMaps(any));
        KaravanApi.getSecrets((any: []) => InfrastructureAPI.setSecrets(any));
        KaravanApi.getServices((any: []) => InfrastructureAPI.setServices(any));
        KaravanApi.getImages(projectId, (images: []) => useProjectStore.setState({images: images}));
    }

    public static reloadBlockedTemplates() {
        KaravanApi.getTemplatesFiles((files: ProjectFile[]) => {
            files.filter(f => f.name.endsWith('blocklist.txt')).forEach(file => {
                if (file.name === 'components-blocklist.txt') {
                    ComponentApi.saveBlockedComponentNames(file.code.split(/\r?\n/));
                } else if (file.name === "kamelets-blocklist.txt") {
                    KameletApi.saveBlockedKameletNames(file.code.split(/\r?\n/));
                }
            });
        });
    }

    public static refreshSharedData(after?: (schemaFiles: ProjectFile[], projectFiles: ProjectFile[], sharedFile?: ProjectFile) => void) {
        const filesByNamePromise = new Promise<ProjectFile[]>((resolve) => {
            KaravanApi.getFilesByName(ASYNCAPI_FILE_NAME_JSON, files => {
                resolve(files);
            });
        });

        const sharedFilesPromise = new Promise<ProjectFile[]>((resolve) => {
            KaravanApi.getFiles(ProjectType.shared, (files: ProjectFile[]) => {
                resolve(files);
            });
        });

        Promise.all([filesByNamePromise, sharedFilesPromise])
            .then(([projectAsyncApiFiles, sharedFiles]) => {
                const sharedAsyncApiFile = sharedFiles.find(f => f.name === ASYNCAPI_FILE_NAME_JSON);
                const schemaFiles = sharedFiles.filter(f => f.name.endsWith(JSON_SCHEMA_EXTENSION));
                after?.(schemaFiles, projectAsyncApiFiles, sharedAsyncApiFile);
            });
    }
}