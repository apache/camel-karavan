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
import * as fs from 'fs';
import 'mocha';
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import { TopologyUtils } from '../src/core/api/TopologyUtils';
import { KameletApi } from '../src/core/api/KameletApi';
import { Property } from '../src/core/model/KameletModels';
import { CamelUtil } from '../src/core/api/CamelUtil';
import { ToDefinition } from '../src/core/model/CamelDefinition';
import { SpiBeanApi } from '../src/core/api/SpiBeanApi';


describe('SPI Beans', () => {

    it('Find Simple', () => {
        loadBeans();
        const interfaceType = 'org.apache.camel.spi.AggregationRepository'
        const aggr = SpiBeanApi.findByInterfaceType(interfaceType);
        console.log(aggr.length)

        const aggrWoP = SpiBeanApi.findByInterfaceTypeSimple(interfaceType);
        console.log(aggrWoP.length)
    });

    function loadBeans() {
        const beansJson = fs.readFileSync('test/spiBeans.json',{encoding:'utf8', flag:'r'});
        const jsons: string[] = [];
        JSON.parse(beansJson).forEach((c: any) => jsons.push(JSON.stringify(c)));
        SpiBeanApi.saveSpiBeans(jsons);
    }

});
