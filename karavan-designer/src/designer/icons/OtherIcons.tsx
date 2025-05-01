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

export function AutoStartupFalseIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="icon" width="24px" height="24px">
            <circle cx="16" cy="16" r="13" fill="white" stroke="black" strokeWidth="1px"/>
                <rect x="12" y="10" width="2" height="12" fill="black"/>
                <rect x="18" y="10" width="2" height="12" fill="black"/>
        </svg>
    );
}

export function ErrorHandlerIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="icon" width="24px" height="24px">
            <circle cx="16" cy="16" r="13" fill="white" stroke="black" strokeWidth="1px"/>
            <path d="m19.264 14.98-3.998 7-1.736-1 2.287-4h-3.889l3.993-7 1.737 1-2.284 4z"/>
        </svg>
    );
}
