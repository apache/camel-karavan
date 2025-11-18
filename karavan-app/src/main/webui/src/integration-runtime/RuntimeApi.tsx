import axios from "axios";
import {IntegrationFile} from "karavan-core/lib/model/IntegrationDefinition";
import {AuthApi} from "@/auth/AuthApi";
import {ErrorEventBus} from "@/api/ErrorEventBus";
import {MainConfiguration} from "@/integration-runtime/RuntimeModels";
import {EventBus} from "@/integration-designer/utils/EventBus";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class RuntimeApi {

    static async getMainConfiguration(containerId: string, after: (mainConfiguration: MainConfiguration[]) => void) {
        instance.get('/ui/runtime/main-configuration/' + containerId, {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data?.['main-configuration']?.configurations);
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

    static async getRuntimeRouteAction(projectId: string, env: string, routeId: string, action: string, after: (res: any) => void) {
        instance.get(`/ui/runtime/route/${env}/${projectId}/${routeId}/${action}`)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                    EventBus.sendAlert("Action Send", `Action ${action} for ${routeId} for ${projectId} send`);
                } else {
                    after({});
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }
}
