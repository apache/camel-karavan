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
import {CamelModelMetadata, ElementMeta} from "../lib/model/CamelMetadata";

describe('Add Step', () => {

    it('Add Step', () => {
        const i = Integration.createNew("test")

        const when1 = new WhenDefinition({
            expression: new ExpressionDefinition({simple: '$[body} != null'}),
            steps: [new LogDefinition({logName: 'log11', message: "hello11"})]
        })
        const choice = new ChoiceDefinition({when: [when1]})
        const flow1 = new FromDefinition({uri: "direct1"});

        flow1.steps?.push(choice);
        i.spec.flows?.push(new RouteDefinition({from:flow1}));

        const when2 = new WhenDefinition({
            expression: new ExpressionDefinition({simple: '$[body} != "null"'}),
            steps: [new LogDefinition({logName: 'log22', message: "hello22"})]
        })
        const i2 = CamelDefinitionApiExt.addStepToIntegration(i, when2, choice.uuid);

        if (i2.spec.flows && i2.spec.flows.length > 0) {
            const f: FromDefinition = i2.spec.flows[0].from;
            const c: ChoiceDefinition = f.steps ? f.steps[0] : new ChoiceDefinition();
            const w = c.when ? c.when[1] : undefined;
            expect(c?.when?.length).to.equal(2);
        }
    });

    it('Add step to Otherwise', () => {
        const yaml = fs.readFileSync('test/addStep1.yaml',{encoding:'utf8', flag:'r'});
        const i1 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);

        if (i1.spec.flows && i1.spec.flows.length > 0) {
            const r: RouteDefinition = i1.spec.flows[0];
            const c: ChoiceDefinition = r ? r.from?.steps[1] : new ChoiceDefinition();
            const parentUuid = c.otherwise?.uuid || "";

            const step: MulticastDefinition = new MulticastDefinition();
            const i2 = CamelDefinitionApiExt.addStepToIntegration(i1, step, parentUuid);

            if (i2.spec.flows) {
                expect(i2.spec.flows[0].from.steps[1].otherwise.steps.length).to.equal(1);
            }
        }
    });

    it('Add step to Catch', () => {
        const yaml = fs.readFileSync('test/addStep1.yaml',{encoding:'utf8', flag:'r'});
        const i1 = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);

        if (i1.spec.flows && i1.spec.flows.length > 0) {
            const r: RouteDefinition = i1.spec.flows[0];
            const t: TryDefinition = r ? r.from?.steps[0] : new TryDefinition();
            const c: CatchDefinition = t.doCatch ? t.doCatch[0] : new CatchDefinition();
            const parentUuid = c.uuid || "";

            const w: WhenDefinition = new WhenDefinition({expression: new ExpressionDefinition({simple: new SimpleExpression({expression:"${body} != null"})})});
            const i2 = CamelDefinitionApiExt.addStepToIntegration(i1, w, parentUuid);

            if (i2.spec.flows) {
                expect(i2.spec.flows[0].from.steps[0].doCatch[0].onWhen.expression.simple.expression).to.equal("${body} != null");
            }
        }
    });

    it('Add Step to position', () => {
        const i = Integration.createNew("test")

        const log1 =new LogDefinition({logName: 'log11', message: "hello11"});
        const log2 =new LogDefinition({logName: 'log11', message: "hello22"});
        const log3 =new LogDefinition({logName: 'log11', message: "hello33"});

        const from = new FromDefinition({uri: "direct1"});
        from.steps?.push(log1);
        from.steps?.push(log2);
        from.steps?.push(log3);
        i.spec.flows?.push(new RouteDefinition({from:from}));

        const choice = new ChoiceDefinition({})
        const i2 = CamelDefinitionApiExt.addStepToIntegration(i, choice, from.uuid, 2);

        if (i2.spec.flows && i2.spec.flows.length > 0) {
            const f: FromDefinition = i2.spec.flows[0].from;
            const c: ChoiceDefinition = f.steps[2];
            expect(c?.dslName).to.equal('ChoiceDefinition');

        }
    });

});