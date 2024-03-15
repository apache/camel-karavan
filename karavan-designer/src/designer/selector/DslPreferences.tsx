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

import {DslMetaModel} from "../utils/DslMetaModel";

export class PreferredElements {
    eip: PreferredElement[] = [];
    components: PreferredElement[] = [];
    kamelets: PreferredElement[] = [];

    public constructor(init?: Partial<PreferredElements>) {
        Object.assign(this, init);
    }
}

export class PreferredElement {
    dslKey: string = '';
    count: number = 0;

    public constructor(init?: Partial<PreferredElement>) {
        Object.assign(this, init);
    }
}

const PREFERRED_ELEMENTS_STORAGE_NAME = 'PREFERRED_ELEMENTS'

function addCount(pe: PreferredElement): PreferredElement {
    return new PreferredElement({dslKey: pe.dslKey, count: pe.count + 1});
}

export function getPreferredElements(type: 'eip' | 'components' | 'kamelets'): string[] {
    const result: string[] = [];
    try {
        const local = localStorage.getItem(PREFERRED_ELEMENTS_STORAGE_NAME);
        if (local !== null) {
            const pes = new PreferredElements(JSON.parse(local));
            (pes as any)[type].forEach((pe: PreferredElement) => result.push(pe.dslKey));
        }
    } catch (e) {
        console.log(e);
    }
    return result;
}

export function addPreferredElement(type: 'eip' | 'components' | 'kamelets', dsl: DslMetaModel) {
    try {
        const dslKey = type === 'eip' ? dsl.dsl : (type === 'components' ? dsl.uri : dsl.name);
        const local = localStorage.getItem(PREFERRED_ELEMENTS_STORAGE_NAME);
        const pes = local !== null ? new PreferredElements(JSON.parse(local)) : new PreferredElements();
        let list: PreferredElement[] = (pes as any)[type];
        if (list.findIndex(pe => pe.dslKey === dslKey) !== -1) {
            list = list.map(pe => pe.dslKey === dslKey ? addCount(pe) : pe);
        } else {
            list.push(new PreferredElement({dslKey: dslKey, count: 1}))
        }
        list = list.sort((a, b) => b.count - a.count).filter((_, i) => i < 20);
        (pes as any)[type] = [...list];
        localStorage.setItem(PREFERRED_ELEMENTS_STORAGE_NAME, JSON.stringify(pes));
    } catch (e) {
        console.log(e);
    }
}

export function deletePreferredElement(type: 'eip' | 'components' | 'kamelets', dsl: DslMetaModel) {
    try {
        const dslKey = type === 'eip' ? dsl.dsl : (type === 'components' ? dsl.uri : dsl.name);
        const local = localStorage.getItem(PREFERRED_ELEMENTS_STORAGE_NAME);
        const pes = local !== null ? new PreferredElements(JSON.parse(local)) : new PreferredElements();
        let list: PreferredElement[] = (pes as any)[type];
        (pes as any)[type] = [...list.filter(l => l.dslKey !== dslKey)];
        localStorage.setItem(PREFERRED_ELEMENTS_STORAGE_NAME, JSON.stringify(pes));
    } catch (e) {
        console.log(e);
    }
}
