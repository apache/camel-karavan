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
import {ProjectModel, ProjectProperty} from "../model/ProjectModel";
import {v4 as uuidv4} from "uuid";

export class ProjectModelApi {

    static propertiesToProject = (properties: string): ProjectModel => {
        const lines = properties.split(/\r?\n/).filter(text => text.trim().length > 0 && !text.trim().startsWith("#"));
        const project = new ProjectModel();

        project.properties = this.propertiesFromMap(this.propertiesToMap(lines));

        Object.keys(project).filter(key => key !== 'properties').forEach(key => {
            const value = (project as any)[key];
            if ( value === undefined || value === 'undefined') delete (project as any)[key];
        })
        return project;
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

        if (project.properties && project.properties.length >0){
            project.properties.forEach(p => map.set(p.key, p.value));
        }
        return map;
    }
}
