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
export class DslMetaModel {
    dsl: string = ''
    name: string = ''
    type: string = ''
    uri?: string
    title: string = ''
    description: string = ''
    labels: string = ''
    navigation: string = ''
    version: string = ''
    supportLevel: string = ''
    supportType: string = ''
    properties: any;

    public constructor(init?: Partial<DslMetaModel>) {
        Object.assign(this, init);
    }
}

export class DslProperty {
    name: string = ''
    type: string = ''
    title: string = ''
    description: string = ''
    required: boolean = false;
    secret: boolean = false
    enum: any[] = []

    public constructor(init?: Partial<DslProperty>) {
        Object.assign(this, init);
    }
}

export class DslConstraints {
    constraints: DslConstraint[] = []

    public constructor(init?: Partial<DslConstraints>) {
        Object.assign(this, init);
    }
}

export class DslConstraint {
    name: string = ''
    steps: string[] = []

    public constructor(init?: Partial<DslConstraint>) {
        Object.assign(this, init);
    }
}

export class DslLanguage {
    name: string = ''
    title: string = ''
    description: string = ''

    public constructor(init?: Partial<DslLanguage>) {
        Object.assign(this, init);
    }

    public toString() {
        return this.title;
    }

    static getName(lang: DslLanguage) {
        return lang.name;
    }
}