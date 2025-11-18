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
import {CamelElement, Integration} from "core/model/IntegrationDefinition";
import {v4 as uuidv4} from "uuid";

export class DslPosition {
    step: CamelElement = new CamelElement("");
    prevStep: CamelElement | undefined;
    nextstep: CamelElement | undefined;
    parent: CamelElement | undefined;
    inSteps: boolean = false;
    isSelected: boolean = false;
    position: number = 0;
    inStepsLength: number = 0;
    rect: DOMRect = new DOMRect();
    headerRect: DOMRect = new DOMRect();
    command: "add" | "delete" | "clean" = "add";

    constructor(command: "add" | "delete" | "clean",
                step: CamelElement,
                prevStep: CamelElement | undefined,
                nextstep: CamelElement | undefined,
                parent:CamelElement | undefined,
                rect: DOMRect,
                headerRect:DOMRect,
                position: number,
                inStepsLength: number,
                inSteps: boolean = false,
                isSelected: boolean = false) {
        this.command = command;
        this.step = step;
        this.nextstep = nextstep;
        this.prevStep = prevStep;
        this.parent = parent;
        this.rect = rect;
        this.headerRect = headerRect;
        this.inSteps = inSteps;
        this.position = position;
        this.inStepsLength = inStepsLength;
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

const updates = new Subject<IntegrationUpdate>();
export class IntegrationUpdate {
    integration: Integration;
    propertyOnly: boolean;

    constructor(integration: Integration, propertyOnly: boolean) {
        this.integration = integration;
        this.propertyOnly = propertyOnly;
    }
}

const alerts = new Subject<ToastMessage>();
export class ToastMessage {
    id: string = ''
    text: string = ''
    title: string = ''
    variant: 'success' | 'danger' | 'warning' | 'info' | 'custom';

    constructor(title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'custom') {
        this.id = uuidv4();
        this.title = title;
        this.text = text;
        this.variant = variant;
    }
}
const dslPositions = new Subject<DslPosition>();

export const EventBus = {
    sendPosition: (command: "add" | "delete" | "clean",
                   step: CamelElement,
                   prevStep: CamelElement | undefined,
                   nextstep: CamelElement | undefined,
                   parent: CamelElement | undefined,
                   rect: DOMRect,
                   headerRect: DOMRect,
                   position: number,
                   inStepsLength: number,
                   inSteps: boolean = false,
                   isSelected: boolean = false) => dslPositions.next(
                       new DslPosition(command, step, prevStep, nextstep, parent, rect, headerRect, position, inStepsLength, inSteps, isSelected)),
    onPosition: () => dslPositions.asObservable(),

    sendIntegrationUpdate: (i: Integration, propertyOnly: boolean) => updates.next(new IntegrationUpdate(i, propertyOnly)),
    onIntegrationUpdate: () => updates.asObservable(),

    sendCommand: (command: string, data?: any) => commands.next(new Command(command, data)),
    onCommand: () => commands.asObservable(),

    sendAlert: (title: string, text: string, variant: 'success' | 'danger' | 'warning' | 'info' | 'custom' = 'success') =>
        alerts.next(new ToastMessage(title, text, variant)),
    onAlert: () => alerts.asObservable(),
}
