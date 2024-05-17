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
import React from 'react';

export function AutoStartupIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="icon" width="24px" height="24px">
            <path d="M16 4A12 12 0 1 1 4 16 12.035 12.035 0 0 1 16 4m0-2a14 14 0 1 0 14 14A14.041 14.041 0 0 0 16 2Z"/>
            <path
                d="M0 0h32v32H0z"
                data-name="&lt;Transparent Rectangle&gt;"
                style={{
                    fill: "none",
                }}
            />
            <path d="M19.88 21.847h2l-5-12h-2l-5 12h2l1.24-3h5.53zm-5.93-5 1.82-4.42h.25l1.86 4.42z"/>
        </svg>
    );
}

export function ErrorHandlerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="icon" width="24px" height="24px">
            <path d="M16 4A12 12 0 1 1 4 16 12.035 12.035 0 0 1 16 4m0-2a14 14 0 1 0 14 14A14.041 14.041 0 0 0 16 2Z"/>
            <path
                d="M0 0h32v32H0z"
                data-name="&lt;Transparent Rectangle&gt;"
                style={{
                    fill: "none",
                }}
            />
            <path d="m19.264 14.98-3.998 7-1.736-1 2.287-4h-3.889l3.993-7 1.737 1-2.284 4z"/>
        </svg>
    );
}
