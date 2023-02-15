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
import {expect} from 'chai';
import * as fs from 'fs';
import 'mocha';
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import {ComponentApi} from "../lib/api/ComponentApi";
import {SupportedComponent} from "../src/core/model/ComponentModels";


describe('Supported Components List', () => {

    it('Read Supported Components', () => {
        const json = fs.readFileSync('test/supported-components.json',{encoding:'utf8', flag:'r'});
        ComponentApi.saveSupportedComponents(json);
        const sc = ComponentApi.getSupportedComponents();
        expect(sc.length).to.equal(305);
    });

});
