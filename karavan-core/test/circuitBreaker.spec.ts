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
import {CircuitBreakerDefinition, Resilience4jConfigurationDefinition} from "../lib/model/CamelDefinition";

describe('Circuit Breaker', () => {

    it('Add Step', () => {
        const i = Integration.createNew("circuitBreaker");
        i.type = "plain"

        const circuitBreaker = new CircuitBreakerDefinition({ id: 'cb-1',
            resilience4jConfiguration: new Resilience4jConfigurationDefinition({id: 'rc-1',minimumNumberOfCalls: 5, failureRateThreshold: 50}),
            steps: [new LogDefinition({id: 'log-1',logName: 'log11', message: "hello11"})]
        })
        const flow1 = new FromDefinition({uri: "direct:direct1", id: 'from-1'});

        flow1.steps?.push(circuitBreaker);
        i.spec.flows?.push(new RouteDefinition({id: 'route-1', from:flow1}));

        const yaml = CamelDefinitionYaml.integrationToYaml(i);
        const yaml2 = fs.readFileSync('test/circuitBreaker.yaml',{encoding:'utf8', flag:'r'});
        const i2 = CamelDefinitionYaml.yamlToIntegration("circuitBreaker.yaml", yaml2);
        const yaml3 = CamelDefinitionYaml.integrationToYaml(i2);
        expect(yaml).to.equal(yaml3);
    });
});