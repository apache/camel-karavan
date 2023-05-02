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
import {Subject} from 'rxjs';
import {Project} from "./ProjectModels";

const currentProject = new Subject<Project>();
const currentFile = new Subject<string>();
const showLog = new Subject<string>();


export const ProjectEventBus = {

    selectProject: (project: Project) => currentProject.next(project),
    onSelectProject: () => currentProject.asObservable(),

    selectProjectFile: (fileName: string) => currentFile.next(fileName),
    onSelectProjectFile: () => currentFile.asObservable(),

    showLog: (type: 'container' | 'pipeline', name: string, environment: string) => showLog.next(name),
    onShowLog: () => showLog.asObservable(),
}
