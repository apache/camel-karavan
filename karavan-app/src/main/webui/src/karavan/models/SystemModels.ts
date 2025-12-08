export class KubernetesSecret {
    name: string = '';
    data: any = {}

    public constructor(init?: Partial<KubernetesSecret>) {
        Object.assign(this, init);
    }
}

export class KubernetesConfigMap {
    name: string = '';
    data: any = {}

    public constructor(init?: Partial<KubernetesSecret>) {
        Object.assign(this, init);
    }
}