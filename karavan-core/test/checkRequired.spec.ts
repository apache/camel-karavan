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
    LogDefinition, ExpressionDefinition, SplitDefinition, SimpleExpression
} from "../src/core/model/CamelDefinition";
import {CamelDefinitionApi} from "../src/core/api/CamelDefinitionApi";
import {CamelUtil} from "../src/core/api/CamelUtil";

describe('Check required properties', () => {

    it('Check DSL', () => {
        const log: LogDefinition = CamelDefinitionApi.createLogDefinition({});
        expect(CamelUtil.checkRequired(log)[0]).to.equal(false);
        log.message = '${body}'
        expect(CamelUtil.checkRequired(log)[0]).to.equal(true);

        const split: SplitDefinition = CamelDefinitionApi.createSplitDefinition({});
        expect(CamelUtil.checkRequired(split)[0]).to.equal(false);
        split.expression = new ExpressionDefinition({simple: new SimpleExpression()})
        expect(CamelUtil.checkRequired(split)[0]).to.equal(false);
        split.expression = new ExpressionDefinition({simple: new SimpleExpression({expression: "${body} !== null"})})
        expect(CamelUtil.checkRequired(split)[0]).to.equal(true);
    });

});