import axios from "axios";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {AuthApi} from "@api/auth/AuthApi";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class CustomApi {

    static async getBrand(after: (config: any) => void) {
        instance.get('/brand', {headers: {'Accept': 'application/json'}})
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }
}
