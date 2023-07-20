import {KaravanApi} from "./KaravanApi";
import {DeploymentStatus, PodStatus, Project, ProjectFile, ToastMessage} from "./ProjectModels";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";
import {InfrastructureAPI} from "../designer/utils/InfrastructureAPI";
import {unstable_batchedUpdates} from 'react-dom'
import {
    useAppConfigStore,
    useDeploymentStatusesStore,
    useFilesStore,
    useFileStore, useLogStore,
    useProjectsStore,
    useProjectStore, useDevModeStore
} from "./ProjectStore";
import {ProjectEventBus} from "./ProjectEventBus";

export class ProjectService {

    public static startRunner(project: Project, verbose: boolean) {
        useDevModeStore.setState({status: "starting"})
        KaravanApi.runProject(project, verbose, res => {
            if (res.status === 200 || res.status === 201) {
                ProjectEventBus.sendLog("set", '');
                useLogStore.setState({showLog: true, type: 'container', podName: res.data})
            } else {
                // Todo notification
            }
        });
    }

    public static reloadRunner(project: Project) {
        useDevModeStore.setState({status: "reloading"})
        KaravanApi.reloadDevMode(project.projectId, res => {
            if (res.status === 200 || res.status === 201) {
                // setIsReloadingPod(false);
            } else {
                // Todo notification
                // setIsReloadingPod(false);
            }
        });
    }

    public static deleteRunner(project: Project) {
        useDevModeStore.setState({status: "deleting"})
        ProjectEventBus.sendLog("set", '');
        KaravanApi.deleteRunner(project.projectId, false, res => {
            if (res.status === 202) {
                useLogStore.setState({showLog: false, type: 'container', isRunning: false})
            } else {
                ProjectEventBus.sendAlert(new ToastMessage("Error delete runner", res.statusText, 'warning'))
            }
        });
    }

    public static getDevModePodStatus(project: Project) {
        const projectId = project.projectId;
        KaravanApi.getDevModePodStatus(projectId, res => {
            if (res.status === 200) {
                unstable_batchedUpdates(() => {
                    const podStatus = res.data;
                    if (useDevModeStore.getState().podName !== podStatus.name){
                        useDevModeStore.setState({podName: podStatus.name})
                    }
                    if (useDevModeStore.getState().status !== "running"){
                        useDevModeStore.setState({status: "running"})
                        useLogStore.setState({isRunning: true})
                    }
                    useProjectStore.setState({podStatus: res.data});
                })
            } else {
                unstable_batchedUpdates(() => {
                    if (useDevModeStore.getState().status !== 'none') {
                        useDevModeStore.setState({status: "none", podName: undefined})
                        useProjectStore.setState({podStatus: new PodStatus()});
                    }
                })
            }
        });
    }

    public static pushProject(project: Project, commitMessage: string) {
        useProjectStore.setState({isPushing: true})
        const params = {
            "projectId": project.projectId,
            "message": commitMessage
        };
        KaravanApi.push(params, res => {
            if (res.status === 200 || res.status === 201) {
                useProjectStore.setState({isPushing: false})
                ProjectService.refreshProject(project.projectId);
                ProjectService.refreshProjectData();
            } else {
                // Todo notification
            }
        });
    }

    public static saveFile(file: ProjectFile) {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                const newFile = res.data;
                useFileStore.setState({file: newFile});
                unstable_batchedUpdates(() => {
                    useFilesStore.getState().upsertFile(newFile);
                })
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

    public static refreshDeploymentStatuses(environment: string) {
        KaravanApi.getDeploymentStatuses(environment, (statuses: DeploymentStatus[]) => {
            useDeploymentStatusesStore.setState({statuses: statuses});
        });
    }

    public static deleteProject(project: Project) {
        KaravanApi.deleteProject(project, res => {
            if (res.status === 204) {
                // this.props.toast?.call(this, "Success", "Project deleted", "success");
                ProjectService.refreshProjectData();
            } else {
                // this.props.toast?.call(this, "Error", res.statusText, "danger");
            }
        });
    }

    public static createProject(project: Project) {
        KaravanApi.postProject(project, res => {
            console.log(res.status)
            if (res.status === 200 || res.status === 201) {
                ProjectService.refreshProjectData();
                // this.props.toast?.call(this, "Success", "Project created", "success");
            } else {
                // this.props.toast?.call(this, "Error", res.status + ", " + res.statusText, "danger");
            }
        });
    }

    public static createFile(file: ProjectFile) {
        KaravanApi.postProjectFile(file, res => {
            if (res.status === 200) {
                // console.log(res) //TODO show notification
                ProjectService.refreshProjectData();
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    public static deleteFile(file: ProjectFile) {
        KaravanApi.deleteProjectFile(file, res => {
            if (res.status === 204) {
                ProjectService.refreshProjectData();
            } else {
            }
        });
    }

    public static refreshProjectData() {
        const project = useProjectStore.getState().project;
        KaravanApi.getProject(project.projectId, (project: Project) => {
            // ProjectEventBus.selectProject(project);
            KaravanApi.getTemplatesFiles((files: ProjectFile[]) => {
                files.filter(f => f.name.endsWith("java"))
                    .filter(f => f.name.startsWith(project.runtime))
                    .forEach(f => {
                        const name = f.name.replace(project.runtime + "-", '').replace(".java", '');
                        TemplateApi.saveTemplate(name, f.code);
                    })
            });
        });
        KaravanApi.getFiles(project.projectId, (files: ProjectFile[]) => {
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
    }
}