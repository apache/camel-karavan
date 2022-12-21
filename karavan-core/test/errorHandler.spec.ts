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


describe('Global Error Handler', () => {

    it('Read Global Error Handler from plain YAML', () => {
        const yaml = fs.readFileSync('test/errorHandler1.yaml', {encoding: 'utf8', flag: 'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("errorHandler1.yaml", yaml);
        expect(i.metadata.name).to.equal('errorHandler1.yaml');
        expect(i.spec.flows?.length).to.equal(2);
        expect(i.type).to.equal('plain');
        expect(i.spec.flows?.[1].errorHandler.deadLetterChannel.deadLetterUri).to.equal('log:dlq');
        expect(i.spec.flows?.[1].errorHandler.deadLetterChannel.useOriginalMessage).to.equal(true);
        expect(i.spec.flows?.[1].errorHandler.deadLetterChannel.level).to.equal('TRACE');
        const yaml2 = CamelDefinitionYaml.integrationToYaml(i);
        expect(yaml).to.equal(yaml2);
    });
});