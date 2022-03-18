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
import {Integration} from "../src/core/model/IntegrationDefinition";
import {CamelTrait, JvmTrait, ThreeScaleTrait, Trait} from "../src/core/model/TraitDefinition";

describe('Traits', () => {

    it('Traits to YAML', () => {
        const camel = new CamelTrait({runtimeVersion:"3.16.0", properties:['camel.component.seda.queueSize = 10', 'camel.component.seda.enabled = false']})
        const jvm = new JvmTrait({debug: true, options:["option1", "option2"], classpath:"/path/to/my-dependency.jar:/path/to/another-dependency.jar"})
        const threeScale = new ThreeScaleTrait({enabled: true, auto: true, path: "/"})
        const i1 = Integration.createNew("test");
        i1.spec.traits = new Trait({camel: camel, jvm: jvm, threeScale: threeScale});

        const yaml1 = CamelDefinitionYaml.integrationToYaml(i1);
        const yaml2 = fs.readFileSync('test/trait.yaml',{encoding:'utf8', flag:'r'});
        expect(yaml1).to.equal(yaml2);
        // console.log(yaml1)
    });

    it('YAML to Trait', () => {
        const yaml1 = fs.readFileSync('test/trait.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("demo", yaml1);

        expect(i.spec.traits?.camel?.properties?.length).to.equal(2);
        expect(i.spec.traits?.camel?.properties?.[0]).to.equal("camel.component.seda.queueSize = 10");
        expect(i.spec.traits?.threeScale?.enabled).to.equal(true);
        expect(i.spec.traits?.threeScale?.path).to.equal("/");
    });

});