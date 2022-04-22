import axios, {AxiosResponse} from "axios";

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

    getIntegrations: async (after: (integrations: []) => void) => {
        axios.get('/integration',
            {headers: {'Accept': 'application/json', 'username': 'cameleer'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            console.log(err);
        });
    },

    getIntegration: async (name: string, after: (res: AxiosResponse<any>) => void) => {
        axios.get('/integration/' + name,
            {headers: {'Accept': 'text/plain', 'username': 'cameleer'}})
            .then(res => {
                console.log(res.data);
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    postIntegrations: async (name: string, yaml: string, after: (res: AxiosResponse<any>) => void) => {
        axios.post('/integration/' + name, yaml,
            {headers: {'Accept': 'text/plain', 'Content-Type': 'text/plain', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    deleteIntegration: async (name: string, after: (res: AxiosResponse<any>) => void) => {
        axios.delete('/integration/' + name,
            {headers:{'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
        });
    },

    publishIntegration: async (name: string, yaml: string, after: (res: AxiosResponse<any>) => void) => {
        axios.patch('/integration/' + name, yaml,
            {headers: {'Accept': 'text/plain', 'Content-Type': 'text/plain', 'username': 'cameleer'}})
            .then(res => {
                after(res);
            }).catch(err => {
            after(err);
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