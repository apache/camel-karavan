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
import {FromDefinition, LogDefinition, WhenDefinition, ChoiceDefinition, ExpressionDefinition} from "../src/core/model/CamelDefinition";
import {CamelUtil} from "../src/core/api/CamelUtil";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";
import {FilterDefinition, RouteDefinition, SimpleExpression} from "../src/core/model/CamelDefinition";
import {Integration} from "../src/core/model/IntegrationDefinition";

describe('Delete Step', () => {

    it('Delete Expression in When clause', () => {
        const i = Integration.createNew("test")
        const log1 =new LogDefinition({logName: 'log11', message: "hello11"});
        const log2 =new LogDefinition({logName: 'log11', message: "hello22"});
        const log3 =new LogDefinition({logName: 'log11', message: "hello33"});
        const when1 = new WhenDefinition({
            expression:new ExpressionDefinition({simple: new SimpleExpression({expression: '$[body} != null'})}),
            steps:[log1, log2, log3]
        })
        const choice = new ChoiceDefinition({when:[when1]})
        const from1 = new FromDefinition({uri: "direct1"});
        from1.steps?.push(choice);
        i.spec.flows?.push(new RouteDefinition({from: from1}));
        const when2:WhenDefinition = CamelUtil.cloneStep(when1);
        if (when2 && when2.expression){
            when2.expression.simple = new SimpleExpression({expression: '$[body} == "hello world"'});
        }
        const i2 = CamelDefinitionApiExt.deleteStepFromIntegration(i, log2.uuid);
        if (i2.spec.flows && i2.spec.flows.length > 0){
            const f:FromDefinition = i2.spec.flows[0].from;
            const c:ChoiceDefinition = f.steps ? f.steps[0] : new ChoiceDefinition();
            const w = c.when ? c.when[0] : undefined;
            expect(w?.steps?.length).to.equal(2);
        }
    });

    it('Delete Step from Filter clause', () => {
        const i = Integration.createNew("test")
        const log1 =new LogDefinition({logName: 'log11', message: "hello11"});
        const log2 =new LogDefinition({logName: 'log11', message: "hello22"});
        const log3 =new LogDefinition({logName: 'log11', message: "hello33"});
        const filter = new FilterDefinition({
            expression:new ExpressionDefinition({simple: new SimpleExpression({expression: '$[body} != null'})}),
            steps:[log1, log2, log3]
        })
        const from = new FromDefinition({uri: "direct1"});
        from.steps?.push(filter);
        i.spec.flows?.push(new RouteDefinition({from: from}));


        const i2 = CamelDefinitionApiExt.deleteStepFromIntegration(i, log2.uuid);
        if (i2.spec.flows && i2.spec.flows.length > 0){
            const from:FromDefinition = i2.spec.flows[0].from;
            const f:FilterDefinition = from.steps ? from.steps[0] : new FilterDefinition();
            expect(f.steps?.length).to.equal(2);
        }
    });
});