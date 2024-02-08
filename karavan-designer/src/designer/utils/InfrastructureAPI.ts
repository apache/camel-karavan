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
export class InfrastructureAPI {

    // code API
    static onGetCustomCode: (name: string, javaType: string) => Promise<string | undefined>;
    static onSaveCustomCode: (name: string, code: string) => void;
    static onSave: (filename: string, yaml: string, propertyOnly: boolean) => void;
    static onSavePropertyPlaceholder: (key: string, value: string) => void;
    static onInternalConsumerClick: (uri: string, name: string) => void;

    static setOnGetCustomCode(onGetCustomCode: (name: string, javaType: string) => Promise<string | undefined>){
        this.onGetCustomCode = onGetCustomCode
    }

    static setOnSaveCustomCode(onSaveCustomCode: (name: string, code: string) => void){
        this.onSaveCustomCode = onSaveCustomCode
    }

    static setOnSave(onSave:(filename: string, yaml: string, propertyOnly: boolean) => void){
        this.onSave = onSave
    }

    static setOnSavePropertyPlaceholder(onSavePropertyPlaceholder:(key: string, value: string) => void){
        this.onSavePropertyPlaceholder = onSavePropertyPlaceholder
    }

    static setOnInternalConsumerClick(onInternalConsumerClick:(uri: string, name: string) => void){
        this.onInternalConsumerClick = onInternalConsumerClick
    }

    // Kubernetes/Docker API
    static infrastructure: 'kubernetes' | 'docker' | 'local' = 'local';
    static configMaps: string[] = [];
    static secrets: string[] = [];
    static services: string[] = [];

    static setConfigMaps(configMaps: string[]){
        this.configMaps = configMaps
    }

    static setSecrets(secrets: string[]){
        this.secrets = secrets
    }

    static setServices(services: string[]){
        this.services = services
    }
}