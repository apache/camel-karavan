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


describe('Topology functions', () => {

    it('Topology find', () => {
        loadKamelets();
        const yaml1 = fs.readFileSync('test/topology1.camel.yaml',{encoding:'utf8', flag:'r'});
        const yaml2 = fs.readFileSync('test/topology2.camel.yaml',{encoding:'utf8', flag:'r'});
        const i1 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml1);
        const i2 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml2);
        const tin = TopologyUtils.findTopologyIncomingNodes([i1, i2]);
        const trn = TopologyUtils.findTopologyRestNodes([i1, i2]);
        const ton = TopologyUtils.findTopologyRouteOutgoingNodes([i1, i2]);
    });

    it('Topology getUniqueUri', () => {
        loadKamelets();
        const yaml1 = fs.readFileSync('test/topology3.camel.yaml',{encoding:'utf8', flag:'r'});
        const i1 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml1);
        const tin = TopologyUtils.findTopologyRouteOutgoingNodes([i1]);
    });

    function loadKamelets() {
        const yamls = fs.readFileSync('test/metadata/kamelets.yaml',{encoding:'utf8', flag:'r'});
        const kamelets: string[] = [];
        yamls.split(/\n?---\n?/).map(c => c.trim()).forEach(z => kamelets.push(z));
        KameletApi.saveKamelets(kamelets, true);
    }

});
