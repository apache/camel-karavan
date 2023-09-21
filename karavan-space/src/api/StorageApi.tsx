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

import {GithubParams} from "./GithubApi";

export class StorageApi {

    static getKey(parameters: GithubParams) {
        return parameters.owner + "/" + parameters.repo + "/" + parameters.path;
    }

    static setSessionSha(parameters: GithubParams, sha: string | undefined) {
        if (sha) window.sessionStorage.setItem(StorageApi.getKey(parameters), sha)
        else window.sessionStorage.removeItem(StorageApi.getKey(parameters));
    }

    static getSessionSha(parameters: GithubParams) {
        return window.sessionStorage.getItem(StorageApi.getKey(parameters));
    }

    static setGithubParameters(parameters: GithubParams) {
        window.localStorage.setItem('githubParameters', JSON.stringify(parameters));
    }

    static getGithubParameters(): GithubParams | undefined {
        const param = window.localStorage.getItem('githubParameters');
        return param ? (JSON.parse(param) as GithubParams) : undefined;
    }
}
