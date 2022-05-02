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