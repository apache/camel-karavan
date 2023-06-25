import {KaravanApi} from "../api/KaravanApi";
import {DeploymentStatus, Project, ProjectFile} from "./ProjectModels";
import {TemplateApi} from "karavan-core/lib/api/TemplateApi";
import {KubernetesAPI} from "../designer/utils/KubernetesAPI";
import {useDeploymentStatusesStore, useFilesStore, useProjectsStore, useProjectStore} from "./ProjectStore";

export class ProjectLogic {

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
                ProjectLogic.refreshProjectData();
            } else {
                // this.props.toast?.call(this, "Error", res.statusText, "danger");
            }
        });
    }

    public static createProject(project: Project) {
        KaravanApi.postProject(project, res => {
            console.log(res.status)
            if (res.status === 200 || res.status === 201) {
                ProjectLogic.refreshProjectData();
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
                ProjectLogic.refreshProjectData();
            } else {
                // console.log(res) //TODO show notification
            }
        })
    }

    public static deleteFile(file: ProjectFile) {
        KaravanApi.deleteProjectFile(file, res => {
            if (res.status === 204) {
                ProjectLogic.refreshProjectData();
            } else {
            }
        });
    }


    public static refreshProjectData(environment?: string) {
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