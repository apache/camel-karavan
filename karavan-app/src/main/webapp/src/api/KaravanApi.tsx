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
}