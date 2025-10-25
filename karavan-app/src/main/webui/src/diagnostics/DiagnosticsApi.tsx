import axios from "axios";
import {AuthApi} from "@/auth/AuthApi";
import {ErrorEventBus} from "@/api/ErrorEventBus";
import {CamelStatus} from "@/api/ProjectModels";
import {Buffer} from "buffer";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class DiagnosticsApi {

    static async getAllCamelStatuses(after: (statuses: CamelStatus[]) => void) {
        instance.get('/ui/status/camel')
            .then(res => {
                if (res.status === 200) {
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
                console.log(res)
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
