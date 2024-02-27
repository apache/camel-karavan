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
import { VariableUtil } from '../src/core/api/VariableUtil';
import { IntegrationFile } from '../src/core/model/IntegrationDefinition';

describe('Variables', () => {

    it('Find Variables', () => {
        const yaml1 = fs.readFileSync('test/variable1.camel.yaml',{encoding:'utf8', flag:'r'});
        const yaml2 = fs.readFileSync('test/variable2.camel.yaml',{encoding:'utf8', flag:'r'});
        const variables = VariableUtil.findVariables([
            new IntegrationFile('variable1.camel.yaml', yaml1)
            , new IntegrationFile('variable2.camel.yaml', yaml2)
        ]);
        expect(variables.length).to.equal(19);
    });
});