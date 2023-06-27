import {KaravanApi} from "./KaravanApi";
import {DeploymentStatus, Project, ProjectFile} from "./ProjectModels";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";
import {KubernetesAPI} from "../designer/utils/KubernetesAPI";
import { unstable_batchedUpdates } from 'react-dom'
import {
    useAppConfigStore,
    useDeploymentStatusesStore,
    useFilesStore,
    useFileStore,
    useProjectsStore,
    useProjectStore
} from "./ProjectStore";

export class ProjectService {

    public static pushProject (project: Project, commitMessage: string) {
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

    public static saveFile (file: ProjectFile) {
        console.log(file)
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
        KaravanApi.getProject(projectId , (project: Project)=> {
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
        const environment = useAppConfigStore.getState().config.environment;
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
        KaravanApi.getFiles(project.projectId, (files: []) => {
            useFilesStore.setState({files: files});
        });

        KubernetesAPI.inKubernetes = true;
        if (environment) {
            KaravanApi.getConfigMaps(environment, (any: []) => {
                KubernetesAPI.setConfigMaps(any);
            });
            KaravanApi.getSecrets(environment, (any: []) => {
                KubernetesAPI.setSecrets(any);
            });
            KaravanApi.getServices(environment, (any: []) => {
                KubernetesAPI.setServices(any);
            });
        }
    }
}