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

import {AuthApi} from "./AuthApi";
import {SsoApi} from "./SsoApi";

/**
 * `fetchEventSource` snapshots its `headers` option once and reuses that same
 * object for every automatic reconnect. With OIDC that means the very first
 * access token is replayed forever, so once it expires each reconnect makes the
 * backend log "The JWT is no longer valid".
 *
 * Passing this as the `fetch` option instead makes the Authorization header be
 * rebuilt on every attempt - including reconnects - from a token that is
 * refreshed first when it is close to expiry.
 */
export function authFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (AuthApi.authType !== 'oidc') {
        return window.fetch(input, init);
    }
    return SsoApi.getValidToken().then(token => {
        const headers = new Headers(init?.headers);
        if (token) {
            headers.set('Authorization', 'Bearer ' + token);
        } else {
            headers.delete('Authorization');
        }
        return window.fetch(input, {...init, headers});
    });
}

/**
 * Reconnect backoff for SSE streams. `fetchEventSource` retries every second by
 * default, which turns any persistent failure into a request flood (and a WARN
 * flood in the backend log). Returned from `onerror` to space attempts out.
 */
export function sseRetryInterval(attempt: number): number {
    return Math.min(1000 * Math.pow(2, attempt), 30000);
}
