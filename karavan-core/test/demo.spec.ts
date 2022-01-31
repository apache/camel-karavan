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
import {CamelUtil} from "../src/core/api/CamelUtil";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";
import {CatchDefinition, FromDefinition} from "../src/core/model/CamelDefinition";
import {expect} from "chai";
import {TryDefinition} from "../lib/model/CamelDefinition";

describe('Demo', () => {

    it('Demo', () => {
        const yaml = fs.readFileSync('test/demo.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("demo.yaml", yaml);
        const i2 = CamelUtil.cloneIntegration(i);

        if (i2.spec.flows) {
            const f: FromDefinition = i2.spec.flows[0].from;
            const td: TryDefinition = f.steps[0];
            if (td.doCatch) {
                const c: CatchDefinition | undefined = td.doCatch[0];
                const uuid = c.onWhen?.uuid || '';
                expect(uuid.length).to.above(0)
                const i3 = CamelDefinitionApiExt.deleteStepFromIntegration(i, uuid);
                if (i3.spec.flows && i3.spec.flows.length > 0) {
                    const w = i3.spec.flows[0].from.steps[0].doCatch[0].onWhen;
                    expect(w).to.equal(undefined);
                }
            }
        }
    });

});