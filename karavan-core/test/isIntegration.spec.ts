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
import {FilterDefinition, ToDefinition} from "../src/core/model/CamelDefinition";
import { RouteDefinition} from "../src/core/model/CamelDefinition";
import {Integration} from "../src/core/model/IntegrationDefinition";

describe('Is Integration', () => {

    it('Is not integration', () => {
        const yaml = fs.readFileSync('test/is-not-integration.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlIsIntegration(yaml);
        expect(i).to.equal(false);
    });

    it('Is integration', () => {
        const yaml = fs.readFileSync('test/integration1.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlIsIntegration(yaml);
        expect(i).to.equal(true);
    });

});