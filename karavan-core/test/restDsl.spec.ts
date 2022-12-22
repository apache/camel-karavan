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
import {GetDefinition, PostDefinition, RestDefinition, RouteDefinition} from "../src/core/model/CamelDefinition";
import {FromDefinition} from "../src/core/model/CamelDefinition";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";
import {RestConfigurationDefinition} from "../src/core/model/CamelDefinition";
import {SagaDefinition, ToDefinition} from "../lib/model/CamelDefinition";

describe('REST DSL', () => {

    it('YAML <-> Object 1', () => {
        const yaml = fs.readFileSync('test/restDsl.yaml', {encoding: 'utf8', flag: 'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        expect(i.metadata.name).to.equal('RestDsl');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(3);
        expect(i.type).to.equal('crd');

        i.spec.flows?.filter(f => f.dslName === 'RestDefinition').forEach(f => {
            const rest = f as RestDefinition;
            expect(rest.path).to.equal("/demo");
            expect(rest.post?.length).to.equal(2);
            expect(rest.get?.length).to.equal(2);
        })
    });

    it('Add REST', () => {
        const flow1 = new FromDefinition({uri: "direct1"});
        let i = Integration.createNew("test")
        i.spec.flows?.push(new RouteDefinition({from: flow1}));

        const rest = new RestDefinition({path: "/demo", description: "Hello World"});
        i = CamelDefinitionApiExt.addRestToIntegration(i, rest);
        i = CamelDefinitionApiExt.addRestMethodToIntegration(i, new GetDefinition(), rest.uuid);
        i = CamelDefinitionApiExt.addRestMethodToIntegration(i, new GetDefinition(), rest.uuid);

        const yaml = CamelDefinitionYaml.integrationToYaml(i);

        i.spec.flows?.filter(f => f.dslName === 'RestDefinition').forEach(f => {
                const rest = f as RestDefinition;
                expect(rest.path).to.equal("/demo");
                expect(rest.get?.length).to.equal(2);
            })
    });

    it('Add REST Configuration', () => {
        let i = Integration.createNew("test")
        i.spec.flows?.push(new RestDefinition({path:"path1", post:[new PostDefinition({to:"direct:direct1"})]}));
        i.spec.flows?.push(new RestDefinition({path:"path2", post:[new PostDefinition({to:"direct:direct2"})]}));
        i.spec.flows?.push(new RestConfigurationDefinition({port: "8080", host:"localhost"}));

        const yaml = CamelDefinitionYaml.integrationToYaml(i);
        const i2 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        const x: RestConfigurationDefinition = i2.spec.flows?.[0] as RestConfigurationDefinition;
        expect(x?.port).to.equal('8080');
        expect(x?.host).to.equal('localhost');

        const yaml2 = fs.readFileSync('test/restConfigDsl.yaml', {encoding: 'utf8', flag: 'r'});
        const i3 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml2);
        const x3: RestConfigurationDefinition = i3.spec.flows?.[0] as RestConfigurationDefinition;
        expect(x3?.port).to.equal('8080');
        expect(x3?.host).to.equal('localhost');
    });

});