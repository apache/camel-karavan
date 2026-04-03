import axios from "axios";
import {Health, Metric} from "@models/DashboardModels";
import {AuthApi} from "@api/auth/AuthApi";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {IntegrationFile} from "@core/model/IntegrationDefinition";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class DashboardApi {

    static async getMetrics(after: (metrics: Metric[]) => void) {
        instance.get('/ui/metric', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after([]);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }

    static async getHealths(after: (healths: Health[]) => void) {
        instance.get('/ui/health', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after([]);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }

    static async getRuntimeSources(projectId: string, after: (ifiles: IntegrationFile[]) => void) {
        instance.get('/ui/runtime/sources/' + projectId)
            .then(res => {
                if (res.status === 200) {
                    const files: IntegrationFile[] = Object.getOwnPropertyNames(res?.data).map(key => new IntegrationFile(key, res.data[key]));
                    after(files);
                } else {
                    after([]);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }
}
