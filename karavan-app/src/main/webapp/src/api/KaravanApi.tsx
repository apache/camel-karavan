import axios, {AxiosResponse} from "axios";
import {Project, ProjectFile, ProjectStatus} from "../models/ProjectModels";

export const KaravanApi = {

    getConfiguration: async (after: (config: {}) => void) => {
        axios.get('/configuration',
            {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getProject: async (projectId: string, after: (project: Project) => void) => {
        axios.get('/project/' + projectId,
            {headers: {'Accept': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getProjectStatus: async (projectId: string, after: (status: ProjectStatus) => void) => {
        axios.get('/status/' + projectId,
            {headers: {'Accept': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getProjects: async (after: (projects: Project[]) => void) => {
        axios.get('/project',
            {headers: {'Accept': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data.map((p: Partial<Project> | undefined) => new Project(p)));
                }
            }).catch(err => {
            console.log(err);
        });
    },

    postProject: async (project: Project, after: (res: AxiosResponse<any>) => void) => {
        axios.post('/project', project,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    copyProject: async (sourceProject: string, project: Project, after: (res: AxiosResponse<any>) => void) => {
        axios.post('/project/copy/' + sourceProject, project,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    deleteProject: async (project: Project, after: (res: AxiosResponse<any>) => void) => {
        axios.delete('/project/' + encodeURI(project.projectId),
            {headers:{'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    getFiles: async (project: string, after: (files: []) => void) => {
        axios.get('/file/' + project,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    postProjectFile: async (file: ProjectFile, after: (res: AxiosResponse<any>) => void) => {
        axios.post('/file', file,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    deleteProjectFile: async (file: ProjectFile, after: (res: AxiosResponse<any>) => void) => {
        axios.delete('/file/' + file.projectId + '/' + file.name,
            {headers:{'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    push: async (project: Project, after: (res: AxiosResponse<any>) => void) => {
        axios.post('/git', project,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    pipelineRun: async (project: Project, environment: string, after: (res: AxiosResponse<any>) => void) => {
        axios.post('/kubernetes/pipeline/' + environment, project,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    getPipelineLog: async (environment: string, pipelineRunName: string, after: (res: AxiosResponse<any>) => void) => {
        axios.get('/kubernetes/pipeline/log/' + environment + "/" + pipelineRunName,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getContainerLog: async (environment: string, name: string, after: (res: AxiosResponse<string>) => void) => {
        axios.get('/kubernetes/container/log/' + environment + "/" + name,
            {headers: {'Accept': 'application/json', 'Content-Type': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getKameletNames: async (after: (names: []) => void) => {
        axios.get('/kamelet',
            {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getKamelet: async (name: string, after: (yaml: string) => void) => {
        axios.get('/kamelet/' + name,
            {headers: {'Accept': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getComponentNames: async (after: (names: []) => void) => {
        axios.get('/component',
            {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getComponent: async (name: string, after: (json: string) => void) => {
        axios.get('/component/' + name,
            {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(JSON.stringify(res.data));
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getOpenApis: async (after: (openapis: []) => void) => {
        axios.get('/openapi',
            {headers: {'Accept': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getOpenApi: async (name: string, after: (res: AxiosResponse<any>) => void) => {
        axios.get('/openapi/' + name,
            {headers: {'Accept': 'text/plain', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    postOpenApi: async (name: string, json: string, generateRest: boolean, generateRoutes: boolean, integrationName: string,  after: (res: AxiosResponse<any>) => void) => {
        const uri = `/openapi/${name}/${generateRest}/${generateRoutes}/${integrationName}`;
        axios.post(encodeURI(uri), json,
            {headers: {'Accept': 'text/plain', 'Content-Type': 'text/plain', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },
}