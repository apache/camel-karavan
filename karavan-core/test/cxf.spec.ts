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
import 'mocha';
import {
    FromDefinition
} from "../src/core/model/CamelDefinition";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import * as fs from 'fs';
import {ComponentApi} from "../src/core/api/ComponentApi";

describe('CXF Component', () => {

    it('Parse URI', () => {
        const json = fs.readFileSync('test/cxf.json', {encoding: 'utf8', flag: 'r'});
        ComponentApi.saveComponent(json);

        const yaml = fs.readFileSync('test/cxf.yaml', {encoding: 'utf8', flag: 'r'});
        const i1 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);

        const from: FromDefinition = i1.spec.flows?.[0].from;
        const to = from.steps[0]
        expect(CamelDefinitionApiExt.getParametersValue(from, 'beanId', true)).to.equal(undefined);
        expect(CamelDefinitionApiExt.getParametersValue(from, 'address', true)).to.equal("//{{output.url}}");
        expect(CamelDefinitionApiExt.getParametersValue(to, 'beanId', true)).to.equal("bean:beanName");
        expect(CamelDefinitionApiExt.getParametersValue(to, 'address', true)).to.equal(undefined);
    });

});