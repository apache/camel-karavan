import axios from "axios";
import {AuthApi} from "@api/auth/AuthApi";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {KubernetesConfigMap, KubernetesSecret} from "@models/SystemModels";
import {Buffer} from 'buffer';

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class SystemApi {

    // Secrets
    static async createSecret(secretName: string, after: (val: string) => void) {
        instance.post('/platform/system/secrets/' + Buffer.from(secretName).toString('base64'), {},{headers: {'Content-Type': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getSecrets(after: (secrets: KubernetesSecret[]) => void) {
        instance.get('/platform/system/secrets', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async deleteSecret(secretName: string, after: (val: string) => void) {
        instance.delete('/platform/system/secrets/' + Buffer.from(secretName).toString('base64'))
            .then(res => {
                if (res.status === 204) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getSecretValue(secretName: string, secretKey: string, after: (val: string) => void) {
        instance.get('/platform/system/secrets/' + Buffer.from(secretName).toString('base64') + '/' + Buffer.from(secretKey).toString('base64'), {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async setSecretValue(secretName: string, secretKey: string, value: string, after: (val: string) => void) {
        instance.post('/platform/system/secrets/' + Buffer.from(secretName).toString('base64') + '/' + Buffer.from(secretKey).toString('base64'),
            Buffer.from(value, 'binary').toString('base64'),
            {headers: {'Content-Type': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async deleteSecretValue(secretName: string, secretKey: string, after: (val: string) => void) {
        instance.delete('/platform/system/secrets/' + Buffer.from(secretName).toString('base64') + '/' + Buffer.from(secretKey).toString('base64'))
            .then(res => {
                if (res.status === 204) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    // ConfigMaps
    static async createConfigMap(secretName: string, after: (val: string) => void) {
        instance.post('/platform/system/configmaps/' + Buffer.from(secretName).toString('base64'), {},{headers: {'Content-Type': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getConfigMaps(after: (secrets: KubernetesConfigMap[]) => void) {
        instance.get('/platform/system/configmaps', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async deleteConfigMap(configmapName: string, after: (val: string) => void) {
        instance.delete('/platform/system/configmaps/' + Buffer.from(configmapName).toString('base64'))
            .then(res => {
                if (res.status === 204) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getConfigMapValue(configmapName: string, configmapKey: string, after: (val: string) => void) {
        instance.get('/platform/system/configmaps/' + Buffer.from(configmapName).toString('base64') + '/' + Buffer.from(configmapKey).toString('base64'), {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async setConfigMapValue(configmapName: string, configmapKey: string, value: string, after: (val: string) => void) {
        instance.post('/platform/system/configmaps/' + Buffer.from(configmapName).toString('base64') + '/' + Buffer.from(configmapKey).toString('base64'), value, {headers: {'Content-Type': 'text/plain'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async deleteConfigMapValue(configmapName: string, configmapKey: string, after: (val: string) => void) {
        instance.delete('/platform/system/configmaps/' + Buffer.from(configmapName).toString('base64') + '/' + Buffer.from(configmapKey).toString('base64'))
            .then(res => {
                if (res.status === 204) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    // Env Vars
    static async getEnvVars(after: (envVars: string[]) => void) {
        instance.get('/ui/diagnostics/env-vars', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getEnvVarValue(name: string, after: (val: string) => void) {
        instance.get('/ui/diagnostics/env-vars/' + Buffer.from(name).toString('base64'), {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    // Application Properties
    static async getAppProps(after: (envVars: string[]) => void) {
        instance.get('/ui/diagnostics/app-props', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async getAppPropValue(name: string, after: (val: string) => void) {
        instance.get('/ui/diagnostics/app-props/' + Buffer.from(name).toString('base64'), {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }
}
