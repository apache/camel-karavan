import axios from "axios";
import {AuthApi} from "@api/auth/AuthApi";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {ProjectValidation} from "@models/ValidationModels";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class ValidationApi {

    static async getAllProjectValidations(after: (result: ProjectValidation[]) => void) {
        instance.get('/ui/validation/')
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

    static async validateProjects(after: () => void) {
        instance.post('/ui/validation/', {})
            .then(res => {
                if (res.status === 200) {
                    after();
                } else {
                    after();
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after();
        });
    }

    static async validateProject(projectId: string, after: () => void) {
        instance.post(`/ui/validation/project/${projectId}`, {})
            .then(res => {
                if (res.status === 200) {
                    after();
                } else {
                    after();
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after();
        });
    }
    static async validateProjectFile(projectId: string, filename: string, after: () => void) {
        instance.post(`/ui/validation/project/${projectId}/${filename}`, {})
            .then(res => {
                if (res.status === 200) {
                    after();
                } else {
                    after();
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after();
        });
    }
}
