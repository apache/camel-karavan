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
import { expect } from 'chai';
import * as fs from 'fs';
import 'mocha';
import { CamelDefinitionYaml } from '../src/core/api/CamelDefinitionYaml';
import { Beans, Integration } from '../src/core/model/IntegrationDefinition';
import { BeanFactoryDefinition } from '../src/core/model/CamelDefinition';

describe('bean configuration', () => {

    it('Read beans from plain YAML', () => {
        const yaml = fs.readFileSync('test/beans1.yaml', { encoding: 'utf8', flag: 'r' });
        const i = CamelDefinitionYaml.yamlToIntegration('beans.yaml', yaml);
        expect(i.metadata.name).to.equal('beans.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(3);
        expect(i.type).to.equal('plain');
        if (i.spec.flows) {
            expect(i.spec.flows[2].beans[0].name).to.equal('myNested');
            expect(i.spec.flows[2].beans[0].type).to.equal('${MyBean.class.name}');
            expect(i.spec.flows[2].beans[0].properties['nested.foo']).to.equal('valueFoo');
            expect(i.spec.flows[2].beans[1].name).to.equal('myProps');
        }
        CamelDefinitionYaml.integrationToYaml(i)
    });

    it('Read beans from Integration', () => {
        const yaml = fs.readFileSync('test/beans2.yaml', { encoding: 'utf8', flag: 'r' });
        const i = CamelDefinitionYaml.yamlToIntegration('beans.yaml', yaml);
        expect(i.metadata.name).to.equal('Beans');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(3);
        expect(i.type).to.equal('crd');
        if (i.spec.flows) {
            expect(i.spec.flows[2].beans[0].name).to.equal('myNested');
            expect(i.spec.flows[2].beans[0].type).to.equal('${MyBean.class.name}');
            expect(i.spec.flows[2].beans[0].properties['nested.foo']).to.equal('valueFoo');
            expect(i.spec.flows[2].beans[1].name).to.equal('myProps');
        }
    });

    function countSubstring(str: string, search: string): number {
        if (search.length === 0) {
            return 0; // Avoid infinite loops for empty search strings
        }

        let count = 0;
        let pos = 0;

        // Loop to find all occurrences of 'search'
        while ((pos = str.indexOf(search, pos)) !== -1) {
            count++; // Increment count for each occurrence found
            pos += search.length; // Move past the last found substring to find next
        }

        return count;
    }

    it('Bean constructor', () => {
        const text = fs.readFileSync('test/beans3.yaml', { encoding: 'utf8', flag: 'r' });
        const i = CamelDefinitionYaml.yamlToIntegration('beans.yaml', text);

        const b = Integration.createNew('beans');
        const bean1 = new BeanFactoryDefinition({
            name: 'Name1', type: 'Type', constructors: {
                0: 'zero',
                1: 'one',
                2: 'two',
            }
        });
        const bean2 = new BeanFactoryDefinition({ name: 'Name2', type: 'Type'});
        b.spec.flows?.push(new Beans({beans: [bean1, bean2]}));
        const yaml = CamelDefinitionYaml.integrationToYaml(b);
        expect(countSubstring(yaml, 'constructors')).to.equal(1);
    });

});
