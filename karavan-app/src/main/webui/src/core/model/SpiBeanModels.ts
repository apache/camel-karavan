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

export class SpiBeanProperty {
    name?: string;
    index: number = 0;
    kind?: string;
    displayName?: string;
    required: boolean = false;
    type?: string;
    javaType?: string;
    deprecated: boolean = false;
    autowired: boolean = false;
    secret: boolean = false;
    defaultValue?: string;
    description?: string;

    public constructor(init?: Partial<SpiBeanProperty>) {
        Object.assign(this, init);
    }
}

export class SpiBean {
    kind?: string;
    name?: string;
    javaType?: string;
    interfaceType?: string;
    title?: string;
    description?: string;
    deprecated?: string;
    groupId?: string;
    artifactId?: string;
    version?: string;
    properties: any;

    public constructor(init?: Partial<SpiBean>) {
        Object.assign(this, init);
    }
}
