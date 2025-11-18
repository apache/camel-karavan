import axios from "axios";
import {AuthApi} from "@/auth/AuthApi";
import {ErrorEventBus} from "@/api/ErrorEventBus";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class DeveloperApi {

    static async transformRequest(json: string, yaml: string, after: (response: any) => void) {
        instance.post(`/platform/developer/transformRequest/`, {dataSample: json, route: yaml})
            .then(res => {
                console.log("res", res);
                after(res);
            }).catch(err => {
                console.error(err);
                ErrorEventBus.sendApiError(err.message);
                after(err);
        });
    }
}
