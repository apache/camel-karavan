import * as yaml from 'js-yaml';

export class Healthcheck {
    interval: string = '';
    retries: number = 0;
    timeout: string = '';
    test: string [] = [];

    public constructor(init?: Partial<Healthcheck>) {
        Object.assign(this, init);
    }
}

export class DockerComposeService {
    container_name: string = '';
    image: string = '';
    restart: string = '';
    ports: string [] =[];
    depends_on: string [] =[];
    environment: any = {};
    healthcheck?: Healthcheck;

    public constructor(init?: Partial<DockerComposeService>) {
        Object.assign(this, init);
    }
}

export class DockerCompose {
    version: string = '';
    services: DockerComposeService[] = [];

    public constructor(init?: Partial<DockerCompose>) {
        Object.assign(this, init);
    }
}

export class ServicesYaml {

    static yamlToServices(code: string): DockerCompose {
        const obj = yaml.load(code);
        const fromYaml = JSON.parse(JSON.stringify(obj));
        const result: DockerCompose = new DockerCompose({version: fromYaml.version});
        Object.keys(fromYaml.services).forEach(key => {
            const o = fromYaml.services[key];
            const service = new DockerComposeService(o);
            if (!service.container_name) {
                service.container_name = key;
            }
            result.services.push(service);
        })
        return result;
    }
}