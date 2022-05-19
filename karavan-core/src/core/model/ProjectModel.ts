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

export class StepStatus {
    status: 'pending' | 'progress' | 'done' | 'error' = 'pending';
    startTime: number = Date.now();
    endTime?: number;

    public constructor(init?: Partial<StepStatus>) {
        Object.assign(this, init);
    }

    static progress(): StepStatus {
        return new StepStatus({status: "progress", startTime: Date.now()})
    }

    static done(stepStatus?: StepStatus): StepStatus | undefined {
        if (stepStatus){
            stepStatus.status = "done";
            stepStatus.endTime = Date.now();
        }
        return stepStatus
    }

    static error(stepStatus?: StepStatus): StepStatus | undefined {
        if (stepStatus) {
            stepStatus.status = "error";
            stepStatus.endTime = Date.now();
        }
        return stepStatus
    }
}

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

export class ProjectStatus extends StepStatus{
    uberJar?: StepStatus;
    build?: StepStatus;
    deploy?: StepStatus;
    undeploy?: StepStatus;
    active: boolean = false;

    public constructor(init?: Partial<ProjectStatus>) {
        super();
        Object.assign(this, init);
    }
}

export class ProjectModel {
    name: string = 'demo'
    version: string = '1.0.0'
    filename: string = 'camel-runner.jar'
    namespace: string = 'default'
    cleanup: boolean = false
    image?: string = this.namespace + "/" + this.name + ":" + this.version
    sourceImage: string = 'java:openjdk-11-ubi8'
    from: string = 'gcr.io/distroless/java:11'
    replicas: number = 1
    nodePort: number = 30777
    server?: string
    username?: string
    password?: string
    token?: string
    target: 'openshift' | 'minikube' | 'kubernetes' = 'minikube'
    deploy: boolean = false
    build: boolean = false
    buildConfig: boolean = false
    uberJar: boolean = true
    manifests: boolean = true
    path: string = ''
    classpathFiles: string = ''
    routesIncludePattern: string = ''
    status: ProjectStatus = new ProjectStatus()
    properties: ProjectProperty[] = []

    public constructor(init?: Partial<ProjectModel>) {
        Object.assign(this, init);
    }

    static createNew(init?: Partial<ProjectModel>): ProjectModel {
        return new ProjectModel(init ? init : {})
    }
}

export class Profile {
    name: string = ''
    project: ProjectModel = ProjectModel.createNew();

    public constructor(init?: Partial<Profile>) {
        Object.assign(this, init);
    }

    static createNew(name: string): Profile {
        return new Profile({name: name, project: ProjectModel.createNew()})
    }

    static create(name: string, project: ProjectModel): Profile {
        return new Profile({name: name, project: project})
    }
}