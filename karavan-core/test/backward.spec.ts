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
import {
    ChoiceDefinition,
    ExpressionDefinition,
    FromDefinition,
    LogDefinition,
    OtherwiseDefinition,
    SimpleExpression,
    ToDefinition,
    WhenDefinition
} from "../src/core/model/CamelDefinition";
import { RouteDefinition} from "../src/core/model/CamelDefinition";
import {Integration} from "../src/core/model/IntegrationDefinition";

describe('Backward for Camel version < 3.16.x', () => {

    it('Object -> YAML', () => {
        const i1 = Integration.createNew("test")

        const when1 = new WhenDefinition({
            expression: new ExpressionDefinition({simple: new SimpleExpression({expression:'${body} != null'})}),
            steps: [new LogDefinition({logName: 'log11', message: "hello11"})]
        })
        const when2 = new WhenDefinition({
            expression: new ExpressionDefinition({simple: new SimpleExpression({expression:'${body} == null'})}),
            steps: [new LogDefinition({logName: 'log22', message: "hello22"})]
        })
        const otherwise = new OtherwiseDefinition({steps: [new LogDefinition({logName: 'logX', message: "helloX"})]})
        const choice = new ChoiceDefinition({when: [when1, when2], otherwise: otherwise})

        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(choice);
        flow1.steps?.push(new ToDefinition({uri: 'kamelet:kamelet2'}));
        flow1.steps?.push(new ToDefinition({uri: 'kamelet:kamelet2'}));
        flow1.parameters = {httpMethodRestrict: 'POST'}
        i1.spec.flows?.push(new RouteDefinition({from: flow1}));

        const flow2 = new FromDefinition({uri: "direct2"});
        flow2.steps?.push(new LogDefinition({logName: 'log1', message: "hello1"}));
        flow2.steps?.push(new LogDefinition({logName: 'log2', message: "hello2"}));

        i1.spec.flows?.push(new RouteDefinition({from: flow2}));
        const yaml1 = CamelDefinitionYaml.integrationToYaml(i1, true);
        const yaml2 = fs.readFileSync('test/backward.yaml',{encoding:'utf8', flag:'r'});
        console.log(yaml1)
        expect(yaml1).to.equal(yaml2);
    });

    it('YAML -> Object', () => {
        const yaml2 = fs.readFileSync('test/backward2.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("kafka2trinobatch.yaml", yaml2, true);
        expect(i.spec.flows?.[0].from.steps.length).to.equal(2);
    });


});