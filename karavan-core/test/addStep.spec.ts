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
import {From, Integration, Log, When, Choice, Expression} from "../src/core/model/CamelModel";
import {CamelApiExt} from "../src/core/api/CamelApiExt";

describe('Add Step', () => {

    const i = Integration.createNew("test")

    const when1 = new When({expression:new Expression({simple:'$[body} != null'}), steps:[new Log({logName: 'log11', message: "hello11"})]})
    const choice = new Choice({when:[when1]})
    const flow1 = new From({uri: "direct1"});

    flow1.steps?.push(choice);
    i.spec.flows.push(flow1);

    const when2 = new When({expression:new Expression({simple:'$[body} != "null"'}), steps:[new Log({logName: 'log22', message: "hello22"})]})
    const i2 = CamelApiExt.addStepToIntegration(i, when2, choice.uuid);

    it('Add Step', () => {
        if (i2.spec.flows && i2.spec.flows.length > 0){
            const f:From = i2.spec.flows[0];
            const c:Choice = f.steps ? f.steps[0] : new Choice();
            const w = c.when ? c.when[1] : undefined;
            expect(c?.when?.length).to.equal(2);
        }

    });
});