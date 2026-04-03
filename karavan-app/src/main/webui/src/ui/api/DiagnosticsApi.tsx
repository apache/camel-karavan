import axios from "axios";
import {AuthApi} from "@api/auth/AuthApi";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {CamelStatus} from "@models/ProjectModels";

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
}
