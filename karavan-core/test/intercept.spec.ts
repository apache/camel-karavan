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
import 'mocha';
import { CamelDefinitionYaml } from '../src/core/api/CamelDefinitionYaml';
import {
    InterceptDefinition,
    RouteConfigurationDefinition,
} from '../src/core/model/CamelDefinition';
import { Integration } from '../src/core/model/IntegrationDefinition';
import { LogDefinition } from '../lib/model/CamelDefinition';

describe('Intercept', () => {

    it('Intercept YAML', () => {
        // const yaml = fs.readFileSync('test/demo.yaml',{encoding:'utf8', flag:'r'});
        // const i = CamelDefinitionYaml.yamlToIntegration("demo.yaml", yaml);
        const i = Integration.createNew('intercept.camel', 'plain');

        const intercept1 = new InterceptDefinition({
            steps: [new LogDefinition({ logName: 'log1', message: 'intercept1' })],
        });
        const intercept2 = new InterceptDefinition({
            steps: [new LogDefinition({ logName: 'log2', message: 'intercept2' })],
        });
        const routeConfiguration = new RouteConfigurationDefinition({
            intercept: [intercept1, intercept2],
        });
        i.spec.flows?.push(routeConfiguration);

        const yaml = CamelDefinitionYaml.integrationToYaml(i);

        const i2 = CamelDefinitionYaml.yamlToIntegration('demo.yaml', yaml);
    });

});