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
    RouteDefinition, TryDefinition, CatchDefinition, RestDefinition, GetDefinition, OpenApiDefinition,
} from '../src/core/model/CamelDefinition';
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import {SimpleExpression} from "../src/core/model/CamelDefinition";
import {Integration} from "../src/core/model/IntegrationDefinition";
import * as fs from 'fs';

describe('OpenAPI', () => {

    it('Simple config', () => {
        let i = Integration.createNew("test")

        const openApi = new OpenApiDefinition({specification: "openapi.json", id: 'openapi-1'});
        const rest = new RestDefinition({id: 'rest-1', path: "/demo", description: "Hello World", openApi: openApi});
        i = CamelDefinitionApiExt.addRestToIntegration(i, rest);

        const yaml1 = CamelDefinitionYaml.integrationToYaml(i);
        const yaml2 = fs.readFileSync('test/openapi.yaml', {encoding: 'utf8', flag: 'r'});

        expect(yaml1).to.equal(yaml2);
    });
});
