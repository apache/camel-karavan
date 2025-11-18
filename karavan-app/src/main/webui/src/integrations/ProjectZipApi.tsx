import axios from "axios";
import {ErrorEventBus} from "@/api/ErrorEventBus";
import {AuthApi} from "@/auth/AuthApi";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class ProjectZipApi {

    static async downloadZip(projectId: string, after: (res: any) => void) {
        instance.get('/ui/zip/project/' + projectId,
            {
                responseType: 'blob', headers: {'Accept': 'application/octet-stream'}
            }).then(response => {
            after(response.data);
        }).catch(err => {
            ErrorEventBus.sendApiError(err);
        });
    }

    static async uploadZip(fileHandle: File, after: (res: any) => void) {
        const formData = new FormData();
        formData.append('file', fileHandle);
        formData.append('name', fileHandle.name);

        instance.post('/ui/zip/project', formData,
            {headers: {'Content-Type': 'multipart/form-data'}}
        ).then(res => {
            if (res.status === 200) {
                after(res);
            } else {
                after(undefined);
            }
        }).catch(err => {
            after(err);
        });
    }
}
