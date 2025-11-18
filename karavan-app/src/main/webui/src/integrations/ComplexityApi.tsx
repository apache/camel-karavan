import axios from "axios";
import {ErrorEventBus} from "@/api/ErrorEventBus";
import {ComplexityProject} from "./ComplexityModels";
import {AuthApi} from "@/auth/AuthApi";

axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';
const instance = AuthApi.getInstance();

export class ComplexityApi {

    static async getComplexityProject(projectId: string, after: (complexity?: ComplexityProject) => void) {
        instance.get('/ui/complexity/' + projectId)
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

    static async getComplexityProjects(after: (complexities: ComplexityProject[]) => void) {
        instance.get('/ui/complexity')
            .then(res => {
                if (res.status === 200) {
                    const c: ComplexityProject[] = Array.isArray(res.data) ? res.data?.map(x => new ComplexityProject(x)) : [];
                    after(c);
                } else {
                    after([]);
                }
            }).catch(err => {
            ErrorEventBus.sendApiError(err);
            after([]);
        });
    }
}
