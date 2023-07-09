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
import {CamelElement} from "karavan-core/lib/model/IntegrationDefinition";

const positions = new Subject<DslPosition>();

export class DslPosition {
    step: CamelElement = new CamelElement("");
    parent: CamelElement | undefined;
    inSteps: boolean = false;
    isSelected: boolean = false;
    position: number = 0;
    rect: DOMRect = new DOMRect();
    headerRect: DOMRect = new DOMRect();
    command: "add" | "delete" | "clean" = "add";

    constructor(command: "add" | "delete" | "clean",
                step: CamelElement,
                parent:CamelElement | undefined,
                rect: DOMRect,
                headerRect:DOMRect,
                position: number,
                inSteps: boolean = false,
                isSelected: boolean = false) {
        this.command = command;
        this.step = step;
        this.parent = parent;
        this.rect = rect;
        this.headerRect = headerRect;
        this.inSteps = inSteps;
        this.position = position;
        this.isSelected = isSelected;
    }
}

const commands = new Subject<Command>();
export class Command {
    command: string;
    data: any;

    constructor(command: string, data: any) {
        this.command = command;
        this.data = data;
    }
}

export const EventBus = {
    sendPosition: (command: "add" | "delete" | "clean",
                   step: CamelElement,
                   parent: CamelElement | undefined,
                   rect: DOMRect,
                   headerRect: DOMRect,
                   position: number,
                   inSteps: boolean = false,
                   isSelected: boolean = false) => positions.next(new DslPosition(command, step, parent, rect, headerRect, position, inSteps, isSelected)),
    onPosition: () => positions.asObservable(),

    sendCommand: (command: string, data?: any) => commands.next(new Command(command, data)),
    onCommand: () => commands.asObservable(),
}
