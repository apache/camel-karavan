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
import {ProjectModel, ProjectStatus} from "../model/ProjectModel";

const PREFIX = "camel.jbang";

export class ProjectModelApi {

    static propertiesToProject = (properties: string): ProjectModel => {
        const lines = properties.split(/\r?\n/).filter(text => text.trim().length > 0 && text.startsWith(PREFIX));
        const map = this.propertiesToMap(lines);
        const project = new ProjectModel();
        project.name = this.getValue(map, "project.name");
        project.version = this.getValue(map, "project.version");
        project.namespace = this.getValue(map, "project.namespace");
        project.tag = this.getValue(map, "build.image.tag");
        project.filesSelected = this.getValue(map, "classpathFiles");
        project.sourceImage = this.getValue(map, "build.image.source-image");

        project.filename = this.getValue(map, "build.image.jar", "package.jar");
        project.replicas = this.getValue(map, "deploy.replicas");
        project.nodePort = this.getValue(map, "deploy.node-port");
        project.server = this.getValue(map, "deploy.server", "build.image.server");
        project.token = this.getValue(map, "deploy.token", "build.image.token");
        const openshift = this.getValue(map, "deploy.openshift", "build.image.openshift");
        const minikube = this.getValue(map, "deploy.minikube", "build.image.minikube");
        project.target = this.getValue(map, openshift ? "openshift" : (minikube ? "minikube" : "kubernetes"));
        project.deploy = this.getValue(map, "deploy");
        project.build = this.getValue(map, "build.image");
        project.uberJar = this.getValue(map, "package");
        project.status = new ProjectStatus();

        Object.keys(project).forEach(key => {
            if ((project as any)[key] === undefined) delete (project as any)[key];
        })
        return new ProjectModel(project);
    }

    static getValue = (map: Map<string, any>, ...keys: string[]): any => {
        for (const key of keys) {
            return map.has(PREFIX + "." + key) ? map.get(PREFIX + "." + key) : undefined;
        }
    }

    static propertiesToMap = (properties: string[]): Map<string, any> => {
        const result = new Map<string, any>();
        properties.forEach(line => {
            const pair = line.split("=").map(line => line.trim());
            result.set(pair[0], pair[1]);
        })
        return result;
    }

    static updateProperties = (properties: string, project: ProjectModel): string => {
        const linesAll = properties.split(/\r?\n/);
        const nonPropLines = linesAll.filter(text => text.trim().length === 0 || !text.startsWith(PREFIX));
        const propLines = linesAll.filter(text => text.trim().length > 0 && text.startsWith(PREFIX));
        const mapFromFile = this.propertiesToMap(propLines);
        const mapFromProject = this.projectToMap(project);
        const result: string[] = [...nonPropLines];
        mapFromFile.forEach((value, key) => {
            if (!mapFromProject.has(key)) result.push(key + "=" + value);
        })
        mapFromProject.forEach((value, key) => {
            result.push(key + "=" + value);
        })
        return result.join("\n");
    }

    static projectToMap = (project: ProjectModel): Map<string, any> => {
        const map = new Map<string, any>();
        if (project.tag?.length === 0) project.tag = project.namespace + "/" + project.name + ":" + project.version;
        this.setValue(map, "project.name", project.name);
        this.setValue(map, "project.version", project.version);
        this.setValue(map, "project.namespace", project.namespace);
        this.setValue(map, "build.image.tag", project.tag);
        this.setValue(map, "deploy.image", project.tag);
        this.setValue(map, "classpathFiles", project.filesSelected);
        this.setValue(map, "build.image.source-image", project.sourceImage);
        this.setValue(map, "build.image.jar", project.filename);
        this.setValue(map, "package.jar", project.filename);
        this.setValue(map, "deploy.replicas", project.replicas);
        this.setValue(map, "deploy.node-port", project.nodePort);
        this.setValue(map, "deploy.server", project.server);
        this.setValue(map, "build.image.server", project.server);
        this.setValue(map, "deploy.token", project.token);
        this.setValue(map, "build.image.token", project.token);
        this.setValue(map, "build.image.openshift", project.target === 'openshift');
        this.setValue(map, "deploy.openshift", project.target === 'openshift');
        this.setValue(map, "build.image.minikube", project.target === 'minikube');
        this.setValue(map, "deploy.minikube", project.target === 'minikube');
        this.setValue(map, "deploy", project.deploy);
        this.setValue(map, "build.image", project.build);
        this.setValue(map, "package", project.uberJar);
        return map;
    }

    static setValue = (map: Map<string, any>, key: string, value: any): Map<string, any> => {
        map.set(PREFIX + "." + key, value);
        return map;
    }
}
