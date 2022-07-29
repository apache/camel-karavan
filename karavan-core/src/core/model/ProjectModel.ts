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
import {v4 as uuidv4} from "uuid";

export class ProjectProperty {
    id: string = ''
    key: string = ''
    value: any

    public constructor(init?: Partial<ProjectProperty>) {
        Object.assign(this, init);
    }

    static createNew(key: string, value: any): ProjectProperty {
        return new ProjectProperty({id: uuidv4(), key: key, value: value})
    }
}

export class ProjectModel {
    properties: ProjectProperty[] = []

    public constructor(init?: Partial<ProjectModel>) {
        Object.assign(this, init);
    }

    static createNew(init?: Partial<ProjectModel>): ProjectModel {
        return new ProjectModel(init ? init : {})
    }
}