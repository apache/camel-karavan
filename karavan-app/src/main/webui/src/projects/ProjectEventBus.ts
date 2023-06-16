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
import {BehaviorSubject, Subject} from 'rxjs';
import {Project} from "./ProjectModels";

const currentProject = new BehaviorSubject<Project | undefined>(undefined);
const currentRunner = new BehaviorSubject<string | undefined>(undefined);
const currentFile = new BehaviorSubject<string | undefined>(undefined);
const showLog = new BehaviorSubject<ShowLogCommand | undefined>(undefined);
const showTrace = new BehaviorSubject<ShowTraceCommand | undefined>(undefined);
const refreshTrace = new BehaviorSubject<boolean>(false);

export class ShowLogCommand {
    type: 'container' | 'pipeline'
    name: string
    environment: string
    show: boolean

    constructor(type: "container" | "pipeline", name: string, environment: string, show: boolean) {
        this.type = type;
        this.name = name;
        this.environment = environment;
        this.show = show;
    }
}

export class ShowTraceCommand {
    name: string
    show: boolean

    constructor(name: string, show: boolean) {
        this.name = name;
        this.show = show;
    }
}
export const ProjectEventBus = {

    selectProject: (project: Project) => currentProject.next(project),
    onSelectProject: () => currentProject.asObservable(),

    setCurrentRunner: (name: string | undefined) => currentRunner.next(name),
    onCurrentRunner: () => currentRunner.asObservable(),

    selectProjectFile: (fileName: string) => currentFile.next(fileName),
    onSelectProjectFile: () => currentFile.asObservable(),

    showLog: (type: 'container' | 'pipeline', name: string, environment: string, show: boolean = true) =>
        showLog.next(new ShowLogCommand(type, name, environment, show)),
    onShowLog: () => showLog.asObservable(),

    showTrace: (name: string, show: boolean = true) => showTrace.next(new ShowTraceCommand(name, show)),
    onShowTrace: () => showTrace.asObservable(),

    refreshTrace: (refresh: boolean) => refreshTrace.next(refresh),
    onRefreshTrace: () => refreshTrace.asObservable(),
}
