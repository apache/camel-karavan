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
export class Header {
    kind: string = '';
    name: string = '';
    title: string = '';
    description: string = '';
    deprecated: boolean = false;
    firstVersion: string = '';
    label: string = '';
    javaType: string = '';
    supportLevel: string = '';
    supportType: string = '';
    groupId: string = '';
    artifactId: string = '';
    version: string = '';
    scheme: string = '';
    extendsScheme: string = '';
    syntax: string = '';
    async: boolean = false;
    api: boolean = false;
    consumerOnly: boolean = false;
    producerOnly: boolean = false;
    lenientProperties: boolean = false;
    componentProperties: any;

    public constructor(init?: Partial<Header>) {
        Object.assign(this, init);
    }
}

export class Component {
    component: Header = new Header();
    properties: any;

    public constructor(init?: Partial<Component>) {
        Object.assign(this, init);
    }
}

export class ComponentProperty {
    name: string = '';
    deprecated: boolean = false;
    description: string = '';
    displayName: string = '';
    group: string = '';
    kind: string = '';
    label: string = '';
    type: string = '';
    secret: boolean = false;
    enum: string[] = [];
    required: boolean = false;
    defaultValue: string | number | boolean | any;
    value: string | any;

    public constructor(init?: Partial<ComponentProperty>) {
        Object.assign(this, init);
    }
}

export class SupportedComponent {
    name: string = '';
    level: string = '';
    native: boolean = false;

    public constructor(init?: Partial<SupportedComponent>) {
        Object.assign(this, init);
    }
}