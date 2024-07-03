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
import * as fs from 'fs';
import { TemplateApi } from '../src/core/api/TemplateApi';

describe('TemplateAPI', () => {

    it('Generate Aggregation Strategy', () => {

        const aggregator = fs.readFileSync('test/template1.AggregationStrategy.java',{encoding:'utf8', flag:'r'});
        const code2 = fs.readFileSync('test/template2.AggregationStrategy.java',{encoding:'utf8', flag:'r'});

        TemplateApi.saveTemplate("aggregator", aggregator)

        const code = TemplateApi.generateCode("aggregator", "CustomAggregationStrategy")
        expect(code2).to.equal(code);
    });

    it('Generate Processor', () => {

        const processor = fs.readFileSync('test/template1.Processor.java',{encoding:'utf8', flag:'r'});
        const code2 = fs.readFileSync('test/template2.Processor.java',{encoding:'utf8', flag:'r'});

        TemplateApi.saveTemplate("processor", processor)

        const code = TemplateApi.generateCode("processor", "CustomProcessor")
        expect(code2).to.equal(code);
    });
});
