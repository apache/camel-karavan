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
import {CamelYaml} from "../src/core/api/CamelYaml";
import {
    CamelElement,
    From,
    Integration,
    To,
    Log,
    When,
    Choice,
    Otherwise,
    Expression
} from "../src/core/model/CamelModel";
import {CamelUtil} from "../src/core/api/CamelUtil";
import {Filter} from "../lib/model/CamelModel";

describe('Clone', () => {

    it('Clone integration', () => {
        const i = Integration.createNew("test")

        const when1 = new When({
            expression: new Expression({simple: '$[body} != null'}),
            steps: [new Log({logName: 'log11', message: "hello11"})]
        })
        const when2 = new When({
            expression: new Expression({simple: '$[body} != "null"'}),
            steps: [new Log({logName: 'log22', message: "hello22"})]
        })
        const otherwise = new Otherwise({steps: [new Log({logName: 'logX', message: "helloX"})]})
        const choice = new Choice({when: [when1, when2], otherwise: otherwise})

        const flow1 = new From({uri: "direct1"});
        flow1.steps?.push(choice);
        flow1.steps?.push(new To({uri: 'kamelet:kamelet2'}));
        flow1.steps?.push(new To({uri: 'kamelet:kamelet2'}));
        flow1.parameters = {httpMethodRestrict: 'POST'}
        i.spec.flows.push(flow1);

        const flow2 = new From({uri: "direct2"});
        flow2.steps?.push(new Log({logName: 'log1', message: "hello1"}));
        flow2.steps?.push(new Log({logName: 'log2', message: "hello2"}));

        i.spec.flows.push(flow2);
        const integ = CamelUtil.cloneIntegration(i);

        const text1 = CamelYaml.integrationToYaml(i);
        const text2 = CamelYaml.integrationToYaml(integ);
        expect(text2).to.equal(text1);
    });

    it('Clone Log step', () => {
        const log1: Log = new Log({logName: 'log1', message: "hello1"});
        const log2: Log = CamelUtil.cloneStep(log1);
        expect(log1.dslName).to.equal(log2.dslName);
        expect(log1.logName).to.equal(log2.logName);
        expect(log1.message).to.equal(log2.message);
    });

    it('Clone Filter step', () => {
        const filter1: Filter = new Filter({expression: new Expression({simple:"${body} == null"}), steps: [new Log({logName:"log1"})]});
        const filter2: Filter = CamelUtil.cloneStep(filter1);
        expect(filter1.dslName).to.equal(filter2.dslName);
        expect(filter1?.expression?.simple).to.equal(filter2?.expression?.simple);
        expect(filter1?.steps?.length).to.equal(filter2?.steps?.length);
    });
});