import {AuthApi} from "./auth/AuthApi";
import {ErrorEventBus} from "@bus/ErrorEventBus";
import {PodEvent} from "@models/ProjectModels";

const instance = AuthApi.getInstance();

export class KubernetesApi {

    static async getPodEvents(containerName: string): Promise<PodEvent[]> {
        try {
            const res = await instance.get(`/ui/infrastructure/pod-events/${containerName}`, {
                headers: { 'Accept': 'application/json' }
            });
            return res.status === 200 ? res.data : [];
        } catch (err) {
            ErrorEventBus.sendApiError(err);
            return [];
        }
    }
}