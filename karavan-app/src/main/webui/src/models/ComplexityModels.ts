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
export enum ComplexityRouteType {
    ROUTE = "ROUTE",
    ROUTE_TEMPlATE = "ROUTE_TEMPlATE",
    TEMPLATED_ROUTE = "TEMPLATED_ROUTE",
}

export class ComplexityRoute {
    routeId: string = ''
    nodePrefixId: string = ''
    fileName: string = ''
    consumers: any = [];
    producers: any[] = [];
    routeTemplateRef: string;
    type: ComplexityRouteType;
    parameters: any
}

export class ComplexityFile {
    fileName: string = '';
    error: string = '';
    type: string = '';
    chars: number = 0;
    routes: number = 0;
    beans: number = 0;
    rests: number = 0;
    processors: any = {};
    componentsInt: any = {};
    componentsExt: any = {};
    kamelets: any = {};

    public constructor(init?: Partial<ComplexityFile>) {
        Object.assign(this, init);
    }
}

export class ComplexityProject {
    projectId: string = '';
    lastUpdateDate: number = 0;
    files: ComplexityFile[] = []
    routes: ComplexityRoute[] = []
    dependencies: string[] = []
    rests: number = 0;
    exposesOpenApi: boolean = false;
    type: string;

    public constructor(init?: Partial<ComplexityProject>) {
        Object.assign(this, init);
    }
}
