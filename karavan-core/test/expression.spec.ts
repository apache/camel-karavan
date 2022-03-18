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
import {AggregateDefinition, ExpressionSubElementDefinition, FilterDefinition} from "../lib/model/CamelDefinition";

describe('Expression to yaml', () => {

    it('Aggregate Expression', () => {
        const i1 = Integration.createNew("test")

        const agg = new AggregateDefinition({
            correlationExpression: new ExpressionSubElementDefinition({simple: new SimpleExpression({expression:'${body} != null'})}),
            steps: [new LogDefinition({logName: 'log11', message: "hello11"})]
        })

        const filter = new FilterDefinition({expression: new ExpressionDefinition({simple: new SimpleExpression({expression:"not null"})})})

        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(filter);
        flow1.steps?.push(agg);
        i1.spec.flows?.push(new RouteDefinition({from: flow1}));

        const yaml1 = CamelDefinitionYaml.integrationToYaml(i1);
        // console.log(yaml1)
    });

});