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
import 'mocha';
import {CamelDefinitionYaml} from "../src/core/api/CamelDefinitionYaml";
import { FromDefinition, LogDefinition, } from '../src/core/model/CamelDefinition';
import { RouteDefinition} from "../src/core/model/CamelDefinition";
import { Beans, Integration } from '../src/core/model/IntegrationDefinition';
import { BeanFactoryDefinition } from '../src/core/model/CamelDefinition';
import { MetadataAnnotations } from '../src/core/model/IntegrationDefinition';

describe('Kamelet <=> YAML', () => {

    it('Yaml to Kamelet', () => {
        const yaml = fs.readFileSync('test/postgresql-source.kamelet.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("postgresql-source.kamelet.yaml", yaml);
    });

    it('Kamelet to YAML with beans', () => {
        const i = Integration.createNew("test", 'kamelet');

        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(new LogDefinition({logName: 'log11', message: "hello11"}));
        i.spec.flows?.push(new RouteDefinition({from:flow1}));

        const b = new Beans();
        b.beans.push(new BeanFactoryDefinition({name: "beanDS1", type: "String.class"}));
        b.beans.push(new BeanFactoryDefinition({name: "beanDS2", type: "String.class"}));
        i.spec.flows?.push(b);
        const a = new MetadataAnnotations({"camel.apache.org/kamelet.group" : "hello world"})
        i.metadata.annotations = a

        // console.log(CamelDefinitionYaml.integrationToYaml(i))
    });

    it('Kamelet to YAML without beans', () => {
        const i = Integration.createNew("test", 'kamelet');

        const flow1 = new FromDefinition({uri: "direct1"});
        flow1.steps?.push(new LogDefinition({logName: 'log11', message: "hello11"}));
        i.spec.flows?.push(new RouteDefinition({from:flow1}));

        console.log(CamelDefinitionYaml.integrationToYaml(i))
    });


});