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
    FromDefinition,
    LogDefinition,
    WhenDefinition,
    ChoiceDefinition,
    MulticastDefinition,
    ExpressionDefinition,
    RouteDefinition, TryDefinition,CatchDefinition
} from "../src/core/model/CamelDefinition";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import {SimpleExpression} from "../src/core/model/CamelDefinition";
import {Integration} from "../src/core/model/IntegrationDefinition";
import * as fs from 'fs';

describe('Check for id duplicates', () => {

    it('Check YAML OK', () => {
        const yaml = fs.readFileSync('test/hasElementWithId.camel.yaml',{encoding:'utf8', flag:'r'});
        const i1 = CamelDefinitionYaml.yamlToIntegration("hasElementWithId.camel.yaml", yaml);

        expect(CamelDefinitionApiExt.hasElementWithId(i1, 'from-47d5')).to.equal(1);
    });

    it('Check YAML OK', () => {
        const yaml = fs.readFileSync('test/hasElementWithId1.camel.yaml',{encoding:'utf8', flag:'r'});
        const i1 = CamelDefinitionYaml.yamlToIntegration("hasElementWithId.camel.yaml", yaml);

        expect(CamelDefinitionApiExt.hasElementWithId(i1, 'fhello-world')).to.equal(2);
    });

    it('Check YAML Error', () => {
        const yaml = fs.readFileSync('test/hasElementWithIdError.camel.yaml', { encoding: 'utf8', flag: 'r' });
        const i1 = CamelDefinitionYaml.yamlToIntegration('hasElementWithId.camel.yaml', yaml);

        expect(CamelDefinitionApiExt.hasElementWithId(i1, 'from-47d5')).to.equal(2);
    });

});
