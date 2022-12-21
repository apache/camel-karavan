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
import {Integration} from "../src/core/model/IntegrationDefinition";
import {FinallyDefinition} from "../lib/model/CamelDefinition";


describe('Plain YAML to integration', () => {

    it('YAML <-> Object', () => {
        const yaml = fs.readFileSync('test/plain1.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        expect(i.metadata.name).to.equal('test1.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(1);
        expect(i.type).to.equal('plain');
        if (i.spec.flows) {
            expect(i.spec.flows[0].from.uri).to.equal('timer:info');
            expect(i.spec.flows[0].from.steps[0].when.length).to.equal(2);
        }
    });

    it('YAML <-> Object 2', () => {
        const yaml = fs.readFileSync('test/plain2.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        expect(i.metadata.name).to.equal('test1.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(1);
        expect(i.type).to.equal('plain');
        if (i.spec.flows) {
            expect(i.spec.flows[0].from.uri).to.equal('timer:info');
            expect(i.spec.flows[0].from.steps[0].expression.constant.expression).to.equal("Hello Yaml !!!");
        }
    });

    it('YAML <-> Integration', () => {
        const yaml = fs.readFileSync('test/plain-try-catch.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("try-catch.yaml", yaml);
        expect(i.metadata.name).to.equal('try-catch.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(1);
        expect(i.type).to.equal('plain');
        const yaml2 = CamelDefinitionYaml.integrationToYaml(i);
        expect(yaml).to.equal(yaml2);
    });

});
