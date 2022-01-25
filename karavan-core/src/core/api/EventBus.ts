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
import {InOut} from "../model/ConnectionModels";
import {CamelElement} from "../model/CamelDefinition";

const positions = new Subject<DslPosition>();
const flowsPosition = new Subject<DOMRect>();

export class DslPosition {
    step: CamelElement = new CamelElement("")
    rect: DOMRect = new DOMRect()

    constructor(step: CamelElement, rect: DOMRect) {
        this.step = step;
        this.rect = rect;
    }
}

export class InOutPosition {
    inout: InOut = new InOut('in', '', 0, 0, 0)
    rect: DOMRect = new DOMRect()

    constructor(inout: InOut, rect: DOMRect) {
        this.inout = inout;
        this.rect = rect;
    }
}

export const EventBus = {
    sendPosition: (step: CamelElement, rect: DOMRect) => positions.next(new DslPosition(step, rect)),
    onPosition: () => positions.asObservable(),
    sendFlowPosition: (rect: DOMRect) => flowsPosition.next(rect),
    onFlowPosition: () => flowsPosition.asObservable(),
};
