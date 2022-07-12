export class KubernetesAPI {

    static inKubernetes: boolean = false;
    static configMaps: string[] = [];
    static secrets: string[] = [];
    static services: string[] = [];

    static setConfigMaps(configMaps: string[]){
        this.configMaps = configMaps
    }

    static setSecrets(secrets: string[]){
        this.secrets = secrets
    }

    static setServices(services: string[]){
        this.services = services
    }
}