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
import {CamelUi} from "../api/CamelUi";

export class InOut {
  type: 'in' | 'out'  = 'in';
  uuid: string = ''
  top: number = 0;
  side: number = 0;
  icon?: string;
  name?: string;

  constructor(type: 'in' | 'out', uuid: string, top: number, side: number, icon?: string, name?: string) {
    this.type = type;
    this.uuid = uuid;
    this.icon = icon;
    this.top = top;
    this.side = side;
    this.name = name;
  }
}

export class Path {
  uuid: string = ''
  startX: number = 0
  startY: number = 0
  endX: number = 0
  endY: number = 0

  constructor(uuid: string, startX: number, startY: number, endX: number, endY: number) {
    this.uuid = uuid;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
  }

  getPath(): string {
    const x = (this.endX + this.startX) / 2;
    const y = (this.endY + this.startY) / 2;
    return 'M ' + this.startX + ',' + this.startY
        + ' C ' + x + ','+ this.startY + ' ' + y +', ' + this.endY
        + ' ' + this.endX + ',' + this.endY ;
  }
}