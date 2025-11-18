import axios from "axios";
import {ErrorEventBus} from "@/api/ErrorEventBus";
import {SearchResult} from "./SearchModels";
import {AuthApi} from "@/auth/AuthApi";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class SearchApi {

    static async searchAll(string: string, after: (result?: SearchResult[]) => void) {
        const encoded = encodeURIComponent(string);
        instance.get('/ui/search/all/' + encoded)
            .then(res => {
                if (res.status === 200) {
                    after(res.data);
                } else {
                    after(undefined);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after(undefined);
        });
    }
}
