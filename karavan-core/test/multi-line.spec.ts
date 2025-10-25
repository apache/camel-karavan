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
import * as fs from 'fs';
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import { FromDefinition, RouteDefinition, ToDefinition } from '../src/core/model/CamelDefinition';
import { Integration } from '../lib/model/IntegrationDefinition';
import { CamelUtil } from '../lib/api/CamelUtil';
import * as yaml from 'js-yaml';

describe('Multi Line', () => {

    it('Multi Line', () => {
        const text = fs.readFileSync('test/multi-line.camel.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("multi-line.camel.yaml", text);
        const i1 = Integration.createNew('multi-line.camel.yaml');
        const i2 = CamelUtil.cloneIntegration(i);
        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(new ToDefinition({uri: 'sql'}));
        flow1.parameters = {httpMethodRestrict: 'POST'}
        i1.spec.flows?.push(new RouteDefinition({from: flow1}));
        const yaml1 = CamelDefinitionYaml.integrationToYaml(i2);
        // console.log(i2.spec.flows?.[0].from.steps[0].parameters.query);

        // const loaded: any =  yaml.load(text);
        // const query = loaded[0].route.from.steps[0].to.parameters.query;
        console.log(yaml1);
    });

});