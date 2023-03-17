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

export class ExchangeElement {
    id: string = ''
    name: string = ''
    customBadgeContent: string = ''

    public constructor(init?: Partial<ExchangeElement>) {
        Object.assign(this, init);
    }
}

export class ExchangeHeader extends ExchangeElement {

}

export class ExchangeProperty extends ExchangeElement {

}

export class ExchangeElementWithChildren extends ExchangeElement {
    children: ExchangeElement[] = []
    defaultExpanded: boolean = false;

    public constructor(init?: Partial<ExchangeElementWithChildren>) {
        super(init);
        Object.assign(this, init);
    }
}

export class ExchangeHeaders extends ExchangeElementWithChildren {

    public constructor(init?: Partial<Body>) {
        super(init);
        this.name = "Headers";
        this.id = "headers";
        this.customBadgeContent = "Map<String, Object>";
        this.children = Array.from(Array(10).keys()).map(value => new ExchangeHeader({id: "id" + value, name: "header" + value, customBadgeContent:"String"}));
    }
}

export class ExchangeProperties extends ExchangeElementWithChildren {
    public constructor(init?: Partial<Body>) {
        super(init);
        this.name = "Properties";
        this.id = "properties";
        this.customBadgeContent = "Map<String, Object>";
    }
}

export class Body extends ExchangeElement {

    public constructor(init?: Partial<Body>) {
        super(init);
        this.name = "Body";
        this.id = "body";
        this.customBadgeContent = "Object";
    }
}

export class Exchange extends ExchangeElementWithChildren {

    public constructor(init?: Partial<Exchange>) {
        super(init);
        this.customBadgeContent = "Exchange";
        if (init?.name === undefined) {
            this.name = "Exchange";
        }
        if (init?.id === undefined) {
            this.id = "exchange";
        }
        if (!init?.children) {
            this.children.push(new ExchangeElement({id:"exchangeId", name: "Exchange ID", customBadgeContent: "String"}))
            this.children.push(new ExchangeHeaders())
            this.children.push(new ExchangeProperties())
            this.children.push(new Body())
        }
    }
}

export class ConnectionsRect {
    width: number = 0
    height: number = 0
    top: number = 0
    left: number = 0

    constructor(width: number, height: number, top: number, left: number) {
        this.width = width;
        this.height = height;
        this.top = top;
        this.left = left;
    }
}

export class ConnectionPoint {
    top: number = 0
    left: number = 0

    constructor(top: number, left: number) {
        this.top = top;
        this.left = left;
    }
}
