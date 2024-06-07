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
import { BeanFactoryDefinition } from '../src/core/model/CamelDefinition';

describe('Integration to YAML', () => {

    it('YAML <-> Object', () => {
        const yaml = fs.readFileSync('test/avro-serialize-action.kamelet.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("avro-serialize-action.kamelet.yaml", yaml);
        expect(i.metadata.name).to.equal('avro-serialize-action');
        expect(i.kind).to.equal('Kamelet');
        if (i.spec.flows?.[1]){
            const b:BeanFactoryDefinition = (i.spec.flows?.[1].beans[0] as BeanFactoryDefinition);
            expect(b.properties.validate).to.equal("{{validate}}");
            expect(b.properties.schema).to.equal("{{schema:}}");
        }
    });

    it('YAML <-> Object', () => {
        const yaml = fs.readFileSync('test/postgresql-source.kamelet.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("postgresql-source.kamelet.yaml", yaml);
        expect(i.metadata.name).to.equal('postgresql-source');
        expect(i.kind).to.equal('Kamelet');
        if (i.spec.flows?.[1]){
            const b:BeanFactoryDefinition = (i.spec.flows?.[1].beans[0] as BeanFactoryDefinition);
            expect(b.properties.username).to.equal("{{username}}");
            expect(b.properties.password).to.equal("{{password}}");
            expect(b.properties.url).to.equal("jdbc:postgresql://{{serverName}}:{{serverPort}}/{{databaseName}}");
            expect(b.properties.driverClassName).to.equal("org.postgresql.Driver");
        }
    });

});