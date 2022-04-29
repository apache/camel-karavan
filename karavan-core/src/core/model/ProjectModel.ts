
export class ProjectStatus {
    uberJar: 'pending' | 'progress' | 'done' | 'error' = 'pending';
    build: 'pending' | 'progress' | 'done' | 'error' = 'pending';
    deploy: 'pending' | 'progress' | 'done'| 'error' = 'pending';
    active: boolean = false;

    public constructor(init?: Partial<ProjectStatus>) {
        Object.assign(this, init);
    }
}

export class ProjectModel {
    name: string = ''
    version: string = '1.0.0'
    filename: string = 'camel-runner.jar'
    namespace: string = 'default'
    tag?: string = ''
    sourceImage: string = 'java:openjdk-11-ubi8'
    replicas: number = 1
    nodePort: number = 30777
    server?: string
    token?: string
    target: 'openshift' | 'minikube' | 'kubernetes' = 'minikube'
    deploy: boolean = false
    build: boolean = false
    uberJar: boolean = true
    filesSelected: string = ''
    status: ProjectStatus = new ProjectStatus()

    public constructor(init?: Partial<ProjectModel>) {
        Object.assign(this, init);
    }

    static createNew(name: string): ProjectModel {
        return new ProjectModel({name: name})
    }
}