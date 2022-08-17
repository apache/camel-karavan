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

describe('CRD YAML to Integration', () => {



    it('YAML <-> Object 1', () => {
        const yaml = fs.readFileSync('test/integration1.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        expect(i.metadata.name).to.equal('test1.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(1);
        expect(i.type).to.equal('crd');
        if (i.spec.flows){
            const f:FilterDefinition = (i.spec.flows[0] as RouteDefinition).from.steps[1];
            const t:ToDefinition = <ToDefinition> (f.steps ? f.steps[0] : undefined);
            expect(t.uri).to.equal("log:info:xxx");
            expect(t.parameters.level).to.equal("OFF");
        }
    });

    it('YAML <-> Object 2', () => {
        const yaml = fs.readFileSync('test/integration2.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        expect(i.metadata.name).to.equal('test1.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(1);
        expect(i.type).to.equal('crd');

        if (i.spec.flows){
            const f:FilterDefinition = (i.spec.flows[0] as RouteDefinition).from.steps[1];
            const t:ToDefinition = <ToDefinition> (f.steps ? f.steps[0] : undefined);
            expect(t.uri).to.equal("log:info:xxx");
            expect(t.parameters.level).to.equal("OFF");
        }
    });

});