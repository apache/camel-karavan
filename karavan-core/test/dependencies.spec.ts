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
import {Dependency} from "../src/core/model/IntegrationDefinition";
import {CamelUtil} from "../src/core/api/CamelUtil";
import {CamelDefinitionApiExt} from "../src/core/api/CamelDefinitionApiExt";

describe('Read/write dependencies', () => {

    it('Dependencies clone', () => {
        const dep1 = Dependency.createNew("mvn:org.apache.camel:karavan:0.0.1");
        const dep2 = CamelUtil.cloneDependency(dep1);
        expect(dep1.uuid).to.equal(dep2.uuid);
        expect(dep1.group).to.equal(dep2.group);
        expect(dep1.artifact).to.equal(dep2.artifact);
        expect(dep1.version).to.equal(dep2.version);
    });

    it('add dependency', () => {
        let integration = new Integration();
        const dep1 = Dependency.createNew("mvn:org.apache.camel:karavan:0.0.1");
        integration = CamelDefinitionApiExt.addDependencyToIntegration(integration, dep1);

        const dep2 = CamelUtil.cloneDependency(dep1);
        const clone = CamelUtil.cloneIntegration(integration);
        dep2.group = "0.0.2";
        integration = CamelDefinitionApiExt.addDependencyToIntegration(clone, dep2);
        if (clone.spec.dependencies) {
            expect(clone.spec.dependencies[0].uuid).to.equal(dep2.uuid);
            expect(clone.spec.dependencies[0].group).to.equal(dep2.group);
            expect(clone.spec.dependencies[0].artifact).to.equal(dep2.artifact);
            expect(clone.spec.dependencies[0].version).to.equal(dep2.version);
        }
    });

    it('Dependencies in Integration CRD', () => {
        const yaml = fs.readFileSync('test/dependencies-crd.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        expect(i.metadata.name).to.equal('test1.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(1);
        expect(i.crd).to.equal(true);
        if (i.spec.flows && i.spec.dependencies){
            expect(i.spec.dependencies.length).to.equal(2);
            expect(i.spec.dependencies[0].group).to.equal("org.apache.commons");
            expect(i.spec.dependencies[0].artifact).to.equal("commons-dbcp2");
            expect(i.spec.dependencies[0].version).to.equal("2.9.0");
        }
        // console.log(CamelDefinitionYaml.integrationToYaml(i))
    });

    it('Dependencies in plain YAML', () => {
        const yaml = fs.readFileSync('test/dependencies-plain.yaml',{encoding:'utf8', flag:'r'});
        const i = CamelDefinitionYaml.yamlToIntegration("test1.yaml", yaml);
        expect(i.metadata.name).to.equal('test1.yaml');
        expect(i.kind).to.equal('Integration');
        expect(i.spec.flows?.length).to.equal(1);
        expect(i.crd).to.equal(false);
        if (i.spec.flows && i.spec.dependencies){
            expect(i.spec.dependencies.length).to.equal(2);
            expect(i.spec.dependencies[0].group).to.equal("org.apache.commons");
            expect(i.spec.dependencies[0].artifact).to.equal("commons-dbcp2");
            expect(i.spec.dependencies[0].version).to.equal("2.9.0");
        }
        i.crd = false
        // console.log(CamelDefinitionYaml.integrationToYaml(i))
    });

});