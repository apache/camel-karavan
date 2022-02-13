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
    ExpressionDefinition,
    SimpleExpression,
    FilterDefinition, CatchDefinition, TryDefinition, RouteDefinition
} from "../src/core/model/CamelDefinition";
import {CamelUtil} from "../src/core/api/CamelUtil";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";
import {Integration} from "../src/core/model/IntegrationDefinition";

describe('Find Step', () => {

    it('Find Expression in When clause', () => {
        const i = Integration.createNew("test")
        const log1 = new LogDefinition({logName: 'log11', message: "hello11"});
        const log2 = new LogDefinition({logName: 'log11', message: "hello22"});
        const log3 = new LogDefinition({logName: 'log11', message: "hello33"});
        const when1 = new WhenDefinition({
            expression: new ExpressionDefinition({simple: new SimpleExpression({expression: '$[body} != null'})}),
            steps: [log1, log2, log3]
        })
        const choice = new ChoiceDefinition({when: [when1]})
        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(choice);
        i.spec.flows?.push(flow1);
        const when2: WhenDefinition = CamelUtil.cloneStep(when1);
        if (when2 && when2.expression) {
            when2.expression.simple = new SimpleExpression({expression: '$[body} == "hello world"'});
        }
        const log: LogDefinition = <LogDefinition> CamelDefinitionApiExt.findElementInIntegration(i, log2.uuid);
        expect(log.logName).to.equal(log2.logName);
        expect(log.message).to.equal(log2.message);
    });

    it('Find Step from Filter clause', () => {
        const i = Integration.createNew("test")
        const log1 = new LogDefinition({logName: 'log11', message: "hello11"});
        const log2 = new LogDefinition({logName: 'log11', message: "hello22"});
        const log3 = new LogDefinition({logName: 'log11', message: "hello33"});
        const filter = new FilterDefinition({
            expression: new ExpressionDefinition({simple: new SimpleExpression({expression: '$[body} != null'})}),
            steps: [log1, log2, log3]
        })
        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(filter);
        i.spec.flows?.push(flow1);


        const log: LogDefinition = <LogDefinition> CamelDefinitionApiExt.findElementInIntegration(i, log2.uuid);
        expect(log.logName).to.equal(log2.logName);
        expect(log.message).to.equal(log2.message);
    });

    it('Find Step from Try-Catch-Finally clause', () => {
        const log1 = new LogDefinition({message: "hello1"});
        const log2 = new LogDefinition({message: "hello2"});
        const log3 = new LogDefinition({message: "hello3"});
        const catch1 = new CatchDefinition({exception:['IOException'], steps: [log1, log2, log3]})
        const log4 = new LogDefinition({message: "hello4"});
        const log5 = new LogDefinition({message: "hello5"});
        const log6 = new LogDefinition({message: "hello6"});
        const catch2 = new CatchDefinition({exception:['NullPointerException'], steps: [log4, log5, log6]})
        const log7 = new LogDefinition({message: "hello7"});
        const log8 = new LogDefinition({message: "hello8"});
        const log9 = new LogDefinition({message: "hello9"});
        const try1 = new TryDefinition({ doCatch:[catch1, catch2], steps: [log7, log8, log9]})
        const from = new FromDefinition({uri: "direct1", steps:[try1]});
        const i = Integration.createNew("test")
        i.spec.flows?.push(new RouteDefinition({from: from}));

        const log: LogDefinition = <LogDefinition> CamelDefinitionApiExt.findElementInIntegration(i, log2.uuid);
        expect(log.logName).to.equal(log2.logName);
        expect(log.message).to.equal(log2.message);
    });
});