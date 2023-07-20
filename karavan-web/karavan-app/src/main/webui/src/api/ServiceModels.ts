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

export class Service {
    name: string = '';
    container_name: string = '';
    image: string = '';
    restart: string = '';
    ports: string [] =[];
    depends_on: string [] =[];
    environment: any = {};
    healthcheck?: Healthcheck;

    public constructor(init?: Partial<Service>) {
        Object.assign(this, init);
    }
}

export class Services {
    version: string = '';
    services: Service[] = [];

    public constructor(init?: Partial<Services>) {
        Object.assign(this, init);
    }
}

export class ServicesYaml {

    static yamlToServices(code: string): Services {
        const obj = yaml.load(code);
        const fromYaml = JSON.parse(JSON.stringify(obj));
        const result: Services = new Services({version: fromYaml.version});
        Object.keys(fromYaml.services).forEach(key => {
            const o = fromYaml.services[key];
            const service = new Service(o);
            service.name = key;
            result.services.push(service);
        })
        return result;
    }
}