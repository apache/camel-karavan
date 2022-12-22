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
import {FromDefinition, ExpressionDefinition, PropertyExpressionDefinition} from "../src/core/model/CamelDefinition";
import {Integration} from "../src/core/model/IntegrationDefinition";
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import {RouteDefinition, SagaDefinition, ToDefinition} from "../lib/model/CamelDefinition";
import * as fs from 'fs';

describe('Multi object property', () => {
    // TODO: Make new test for multiobject property because wireTab has no setHeader anymore

    it('Saga options', () => {
        const i = Integration.createNew("test")
        const option1 = new PropertyExpressionDefinition({key:"key1", expression: new ExpressionDefinition({simple:"${body}"})})
        const option2 = new PropertyExpressionDefinition({key:"key2", expression: new ExpressionDefinition({simple:"${headers}"})})
        const saga = new SagaDefinition({steps: [new ToDefinition({uri: "direct:direct2"})], option: [option1, option2]})
        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(saga);
        i.spec.flows?.push(new RouteDefinition({from: flow1}));

        const yaml = fs.readFileSync('test/multiObjectProperties1.yaml', {encoding: 'utf8', flag: 'r'});

        const i2 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);

        const s: SagaDefinition = i2.spec.flows?.[0].from.steps[0] as SagaDefinition;
        const t: ToDefinition | undefined = s.steps?.[0] as ToDefinition;
        expect(t?.uri).to.equal('direct:direct2');
    });

});