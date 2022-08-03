/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {v4 as uuidv4} from 'uuid';
import {NamedBeanDefinition} from "./CamelDefinition";


export class Spec {
    flows?: any[] = [];

    public constructor(init?: Partial<Spec>) {
        Object.assign(this, init);
    }
}

export class Metadata {
    name: string = '';

    public constructor(init?: Partial<Metadata>) {
        Object.assign(this, init);
    }
}

export class Integration {
    apiVersion: string = 'camel.apache.org/v1';
    kind: string = 'Integration';
    metadata: Metadata = new Metadata();
    spec: Spec = new Spec();
    crd: boolean = true;

    public constructor(init?: Partial<Integration>) {
        Object.assign(this, init);
    }

    static createNew(name?: string): Integration {
        return new Integration({metadata: new Metadata({name: name}), spec: new Spec({flows: []})})
    }
}

export class CamelElement {
    uuid: string = ''
    dslName: string = ''

    constructor(dslName: string) {
        this.uuid = uuidv4()
        this.dslName = dslName
    }

    hasSteps(): boolean {
        return this.hasOwnProperty('steps');
    }

    hasStepName(): boolean {
        return this.hasOwnProperty('stepName');
    }
}

export class Beans extends CamelElement {
    beans: NamedBeanDefinition[] = []

    public constructor(init?: Partial<Beans>) {
        super("Beans")
        Object.assign(this, init);
    }
}

export class CamelElementMeta {
    step?: CamelElement
    parentUuid?: string
    position: number = 0;
    pathUuids: string [] = [];

    constructor(step?: CamelElement, parentUuid?: string, position?: number, pathUuids?: string []) {
        this.step = step;
        this.parentUuid = parentUuid;
        this.position = position || 0;
        this.pathUuids = pathUuids || this.pathUuids;
    }
}