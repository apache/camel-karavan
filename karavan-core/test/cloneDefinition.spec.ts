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
import { FilterDefinition, LogDefinition, ChoiceDefinition,
    FromDefinition, OtherwiseDefinition,
    SimpleExpression,
    ToDefinition,
    WhenDefinition} from "../src/core/model/CamelDefinition";
import {CamelDefinitionApi} from "../src/core/api/CamelDefinitionApi";
import {ExpressionDefinition} from "../src/core/model/CamelDefinition";
import {Integration} from "../src/core/model/IntegrationDefinition";
import {RouteDefinition} from "../src/core/model/CamelDefinition";
import {CamelUtil} from "../src/core/api/CamelUtil";

describe('Clone', () => {

    it('Clone integration', () => {
        const i1 = Integration.createNew("test")

        const when1 = new WhenDefinition({
            expression: new ExpressionDefinition({simple: new SimpleExpression({expression:'${body} != null'})}),
            steps: [new LogDefinition({logName: 'log11', message: "hello11"})]
        })
        const when2 = new WhenDefinition({
            expression: new ExpressionDefinition({simple: '${body} == null'}),
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
        const i2 = cloneIntegration(i1);

        expect(i1.metadata.name).to.equal(i2.metadata.name);
        expect(i1.spec.flows?.length).to.equal(i2.spec.flows?.length);
        if (i1.spec.flows && i2.spec.flows){
            const f1:FromDefinition = i1.spec.flows[0].from;
            const f2:FromDefinition = i2.spec.flows[0].from;
            expect(f1.parameters?.httpMethodRestrict).to.equal(f2.parameters?.httpMethodRestrict);
            expect(f1.steps.length).to.equal(f2.steps.length);

            const c1: ChoiceDefinition = f1.steps[0];
            const c2: ChoiceDefinition = f2.steps[0];

            expect(c1.when?.length).to.equal(c2.when?.length);
            if (c1.when && c2.when){
                const e1:SimpleExpression = <SimpleExpression>c1.when[0].expression?.simple;
                const e2:SimpleExpression = <SimpleExpression>c1.when[0].expression?.simple;
                expect(e1.expression).to.equal(e2.expression);
            }
        }
    });

    function cloneIntegration (integration: Integration): Integration {
        const clone = JSON.parse(JSON.stringify(integration));
        const int: Integration = new Integration({...clone});
        const flows = int.spec.flows?.map(f => CamelDefinitionApi.createFromDefinition(f))
        int.spec.flows = flows;
        return int;
    }

    it('Clone Log step', () => {
        const log1: LogDefinition = new LogDefinition({logName: 'log1', message: "hello1"});
        const log2: LogDefinition = <LogDefinition> CamelUtil.cloneStep(log1);
        expect(log1.dslName).to.equal(log2.dslName);
        expect(log1.logName).to.equal(log2.logName);
        expect(log1.message).to.equal(log2.message);
    });

    it('Clone Filter step', () => {
        const filter1: FilterDefinition = new FilterDefinition({
            expression: new ExpressionDefinition({simple: new SimpleExpression({expression:"${body} == null"})}),
            steps: [new LogDefinition({logName:"log1", message:"Hello world"})]
        });
        const filter2: FilterDefinition = <LogDefinition> CamelUtil.cloneStep(filter1);
        expect(filter1.dslName).to.equal(filter2.dslName);
        expect((filter1?.expression?.simple as SimpleExpression).expression).to.equal((filter2?.expression?.simple as SimpleExpression).expression);
        expect(filter1?.steps?.length).to.equal(filter2?.steps?.length);
    });
});