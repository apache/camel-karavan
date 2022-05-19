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
import {ProjectModel, ProjectStatus, ProjectProperty} from "../model/ProjectModel";
import {v4 as uuidv4} from "uuid";

const PREFIX_JBANG = "camel.jbang";
const PREFIX_MAIN = "camel.main";

export class ProjectModelApi {

    static propertiesToProject = (properties: string): ProjectModel => {
        const allLines = properties.split(/\r?\n/).filter(text => text.trim().length > 0 && !text.trim().startsWith("#"));
        const managedLines = allLines.filter(text => text.startsWith(PREFIX_JBANG) || text.startsWith(this.getKeyWithPrefix('routesIncludePattern')));
        const unmanagedLines = allLines.filter(text => !managedLines.includes(text));
        const map = this.propertiesToMap(managedLines);
        const project = new ProjectModel();
        project.name = this.getValue(map, "project.name");
        project.version = this.getValue(map, "project.version");
        project.namespace = this.getValue(map, "project.namespace");
        project.cleanup = this.getValue(map, "project.cleanup") === "true";
        const image = this.getValue(map, "build.image.image", "deploy.image");
        project.image = image ? image : project.namespace + "/" + project.name + ":" + project.version;
        project.classpathFiles = this.getValue(map, "classpathFiles");
        project.routesIncludePattern = this.getValue(map, "routesIncludePattern");
        project.sourceImage = this.getValue(map, "build.image.source-image");
        project.from = this.getValue(map, "build.image.from");
        project.buildConfig = this.getValue(map, "build.image.build-config") === "true";

        project.filename = this.getValue(map, "build.image.jar", "package.uber-jar.jar");
        project.replicas = this.getValue(map, "deploy.replicas");
        project.nodePort = this.getValue(map, "deploy.node-port");
        project.server = this.getValue(map, "deploy.server", "build.image.server");
        project.username = this.getValue(map, "deploy.username", "build.image.username");
        const openshift = this.getValue(map, "deploy.openshift", "build.image.openshift") === "true";
        const minikube = this.getValue(map, "deploy.minikube", "build.image.minikube") === "true";
        project.target = openshift ? "openshift" : (minikube ? "minikube" : "kubernetes");
        project.deploy = this.getValue(map, "deploy") === "true";
        project.build = this.getValue(map, "build.image") === "true";
        project.uberJar = this.getValue(map, "package") === "true";
        project.manifests = this.getValue(map, "manifests") === "true";
        project.path = this.getValue(map, "manifests.path");
        project.status = new ProjectStatus();
        project.properties = this.propertiesFromMap(this.propertiesToMap(unmanagedLines));

        Object.keys(project).filter(key => key !== 'properties').forEach(key => {
            const value = (project as any)[key];
            if ( value === undefined || value === 'undefined') delete (project as any)[key];
        })
        return project;
    }

    static getValue = (map: Map<string, any>, ...keys: string[]): any => {
        for (const key of keys) {
            const k = this.getKeyWithPrefix(key);
            if  (map.has(k)) return map.get(k);
        }
        return undefined;
    }

    static propertiesToMap = (properties: string[]): Map<string, any> => {
        const result = new Map<string, any>();
        properties.forEach(line => {
            const pair = line.split("=").map(line => line.trim());
            result.set(pair[0], pair[1]);
        })
        return result;
    }

    static propertiesFromMap = (properties: Map<string, any>): ProjectProperty[] =>{
        try {
            return Array.from(properties.keys()).map(key => {
                let x = {id: uuidv4(), key: key, value: properties.get(key)};
                return x;
            });
        } catch (err){
            return [];
        }
    }

    static updateProperties = (properties: string, project: ProjectModel): string => {
        const mapFromProject = this.projectToMap(project);
        const result: string[] = [];
        mapFromProject.forEach((value, key) => {
            if (value !== undefined) result.push(key + "=" + value);
        })
        return result.join("\n");
    }

    static projectToMap = (project: ProjectModel): Map<string, any> => {
        const map = new Map<string, any>();
        if (project.image?.length === 0) project.image = project.namespace + "/" + project.name + ":" + project.version;

        if (project.properties && project.properties.length >0){
            project.properties.forEach(p => map.set(p.key, p.value));
        }
        this.setValue(map, "project.name", project.name);
        this.setValue(map, "project.version", project.version);
        this.setValue(map, "project.namespace", project.namespace);
        this.setValue(map, "project.cleanup", project.cleanup);
        this.setValue(map, "package", project.uberJar);
        this.setValue(map, "package.uber-jar.jar", project.filename);
        this.setValue(map, "package.uber-jar.fresh", true);
        this.setValue(map, "classpathFiles", project.classpathFiles);
        this.setValue(map, "routesIncludePattern", project.routesIncludePattern);
        this.setValue(map, "build.image", project.build);
        this.setValue(map, "build.image.openshift", project.target === 'openshift');
        this.setValue(map, "build.image.build-config", project.buildConfig);
        this.setValue(map, "build.image.push", project.target === 'openshift' && !project.buildConfig);
        this.setValue(map, "build.image.jar", project.filename);
        this.setValue(map, "build.image.image", project.image);
        this.setValue(map, "build.image.source-image", project.sourceImage);
        this.setValue(map, "build.image.from", project.from);
        this.setValue(map, "build.image.server", project.server);
        this.setValue(map, "build.image.username", project.username);
        this.setValue(map, "deploy", project.deploy);
        this.setValue(map, "deploy.openshift", project.target === 'openshift');
        this.setValue(map, "deploy.minikube", project.target === 'minikube');
        this.setValue(map, "deploy.image", project.image);
        this.setValue(map, "deploy.replicas", project.replicas);
        this.setValue(map, "deploy.node-port", project.nodePort);
        this.setValue(map, "deploy.server", project.server);
        this.setValue(map, "deploy.username", project.username);
        this.setValue(map, "undeploy.openshift", project.target === 'openshift');
        this.setValue(map, "undeploy.minikube", project.target === 'minikube');
        this.setValue(map, "undeploy.server", project.server);
        this.setValue(map, "manifests", project.manifests);
        this.setValue(map, "manifests.path", project.manifests);
        this.setValue(map, "manifests.openshift", project.target === 'openshift');
        this.setValue(map, "manifests.minikube", project.target === 'minikube');
        this.setValue(map, "manifests.image", project.image);
        this.setValue(map, "manifests.replicas", project.replicas);
        this.setValue(map, "manifests.node-port", project.nodePort);
        this.setValue(map, "manifests.server", project.server);
        this.setValue(map, "manifests.jar", project.filename);

        return map;
    }

    static setValue = (map: Map<string, any>, key: string, value: any): Map<string, any> => {
        if (value !== undefined && value?.toString().length > 0)
            map.set(this.getKeyWithPrefix(key), value);
        else
            map.set(this.getKeyWithPrefix(key), undefined);
        return map;
    }

    static getKeyWithPrefix = (key: string): string => {
        const prefix = key === 'routesIncludePattern' ? PREFIX_MAIN : PREFIX_JBANG;
        return prefix + "." + key;
    }
}
