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
import {DeploymentStatus, ContainerStatus, Project, ProjectFile} from './ProjectModels';
import {TemplateApi} from 'karavan-core/lib/api/TemplateApi';
import {InfrastructureAPI} from '../designer/utils/InfrastructureAPI';
import {unstable_batchedUpdates} from 'react-dom'
import {
    useFilesStore,
    useStatusesStore,
    useFileStore, useLogStore,
    useProjectsStore,
    useProjectStore, useDevModeStore
} from './ProjectStore';
import {ProjectEventBus} from './ProjectEventBus';
import {EventBus} from "../designer/utils/EventBus";

export class ProjectService {

    public static startDevModeContainer(project: Project, verbose: boolean) {
        useDevModeStore.setState({status: 'wip'})
        KaravanApi.startDevModeContainer(project, verbose, res => {
            useDevModeStore.setState({status: 'none'})
            if (res.status === 200 || res.status === 201) {
                ProjectEventBus.sendLog('set', '');
                useLogStore.setState({showLog: true, type: 'container', podName: res.data})
            } else {
                // Todo notification
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
                // Todo notification
                // setIsReloadingPod(false);
            }
        });
    }

    public static stopDevModeContainer(project: Project) {
        useDevModeStore.setState({status: 'wip'})
        KaravanApi.manageContainer('dev', 'devmode', project.projectId, 'stop', res => {
            useDevModeStore.setState({status: 'none'})
            if (res.status === 200) {
                useLogStore.setState({showLog: false, type: 'container'})
            } else {
                EventBus.sendAlert('Error stopping DevMode container', res.statusText, 'warning')
            }
        });
    }

    public static pauseDevModeContainer(project: Project) {
        useDevModeStore.setState({status: 'wip'})
        KaravanApi.manageContainer('dev', 'devmode', project.projectId, 'pause', res => {
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

    // public static getDevModeStatus(project: Project) {
    //     const projectId = project.projectId;
    //     KaravanApi.getDevModePodStatus(projectId, res => {
    //         if (res.status === 200) {
    //             unstable_batchedUpdates(() => {
    //                 const containerStatus = res.data;
    //                 if (useDevModeStore.getState().podName !== containerStatus.containerName){
    //                     useDevModeStore.setState({podName: containerStatus.containerName})
    //                 }
    //                 if (useDevModeStore.getState().status !== 'wip'){
    //                     useLogStore.setState({isRunning: true})
    //                 }
    //                 useStatusesStore.setState({containerStatus: containerStatus});
    //             })
    //         } else {
    //             unstable_batchedUpdates(() => {
    //                 useDevModeStore.setState({status: 'none', podName: undefined})
    //                 useStatusesStore.setState({containerStatus: new ContainerStatus({})});
    //             })
    //         }
    //     });
    // }

    public static pushProject(project: Project, commitMessage: string) {
        useProjectStore.setState({isPushing: true})
        const params = {
            'projectId': project.projectId,
            'message': commitMessage
        };
        KaravanApi.push(params, res => {
            if (res.status === 200 || res.status === 201) {
                useProjectStore.setState({isPushing: false})
                ProjectService.refreshProject(project.projectId);
                ProjectService.refreshProjectData(project.projectId);
            } else {
                // Todo notification
            }
        });
    }

    public static saveFile(file: ProjectFile, active: boolean) {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                const newFile = res.data;
                useFilesStore.getState().upsertFile(newFile);
                if (active) {
                    useFileStore.setState({file: newFile});
                }
            } else {
                // console.log(res) //TODO show notification
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
        KaravanApi.getAllContainerStatuses( (statuses: ContainerStatus[]) => {
            useStatusesStore.setState({containers: statuses});
        });
    }

    public static refreshAllDeploymentStatuses() {
        KaravanApi.getAllDeploymentStatuses( (statuses: DeploymentStatus[]) => {
            useStatusesStore.setState({deployments: statuses});
        });
    }

    public static refreshDeploymentStatuses(environment: string) {
        KaravanApi.getDeploymentStatuses(environment, (statuses: DeploymentStatus[]) => {
            useStatusesStore.setState({deployments: statuses});
        });
    }

    public static deleteProject(project: Project) {
        KaravanApi.deleteProject(project, res => {
            if (res.status === 204) {
                // this.props.toast?.call(this, 'Success', 'Project deleted', 'success');
                ProjectService.refreshProjectData(project.projectId);
            } else {
                // this.props.toast?.call(this, 'Error', res.statusText, 'danger');
            }
        });
    }

    public static createProject(project: Project) {
        KaravanApi.postProject(project, res => {
            if (res.status === 200 || res.status === 201) {
                ProjectService.refreshProjectData(project.projectId);
                // this.props.toast?.call(this, 'Success', 'Project created', 'success');
            } else {
                // this.props.toast?.call(this, 'Error', res.status + ', ' + res.statusText, 'danger');
            }
        });
    }

    public static createFile(file: ProjectFile) {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                // console.log(res) //TODO show notification
                ProjectService.refreshProjectData(file.projectId);
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    public static deleteFile(file: ProjectFile) {
        KaravanApi.deleteProjectFile(file, res => {
            if (res.status === 204) {
                ProjectService.refreshProjectData(file.projectId);
            } else {
            }
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
        KaravanApi.getFiles(projectId, (files: ProjectFile[]) => {
            useFilesStore.setState({files: files});
        });

        KaravanApi.getConfigMaps((any: []) => {
            InfrastructureAPI.setConfigMaps(any);
        });
        KaravanApi.getSecrets((any: []) => {
            InfrastructureAPI.setSecrets(any);
        });
        KaravanApi.getServices((any: []) => {
            InfrastructureAPI.setServices(any);
        });
        KaravanApi.getImages(projectId, (images: []) => {
            useProjectStore.setState({images: images})
        });
    }
}