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

import { useLayoutEffect, useRef } from 'react';

function useResizeObserver<T extends HTMLElement>(callback: (target: T, entry: ResizeObserverEntry) => void) {
    const ref = useRef<T>(null)

    useLayoutEffect(() => {
        const element = ref?.current;
        if (!element) {
            return;
        }
        const observer1 = new ResizeObserver((entries) => {
            callback(element, entries[0]);
        });
        observer1.observe(element);
        return () => {
            observer1.disconnect();
        };
    }, [callback, ref]);

    return ref
}

export default useResizeObserver;