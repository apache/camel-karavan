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
import * as fs from 'fs';
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";

describe('getToSteps', () => {

    it('getToSteps', () => {
        const yaml = fs.readFileSync('test/getToSteps.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test", yaml);
        const c = CamelDefinitionApiExt.getToStepsFromIntegration(i);
        expect(c.length).to.equal(3);
        expect(c[0][0].dslName).to.equal("ToDefinition");
        expect(c[2][0].dslName).to.equal("KameletDefinition");
    });
});