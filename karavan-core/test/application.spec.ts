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
import {expect} from "chai";
import {ProjectModelApi} from "../src/core/api/ProjectModelApi";

describe('Project configuration', () => {

    it('Read properties', () => {
        const props = fs.readFileSync('test/application.properties',{encoding:'utf8', flag:'r'});
        const project = ProjectModelApi.propertiesToProject(props);
        expect(project.name).to.equal('demo');
        expect(project.namespace).to.equal('development');

        project.tag = 'newtag/proj:latest';
        const newProperties = ProjectModelApi.updateProperties(props, project);
        const tag = newProperties.split(/\r?\n/).filter(l => l.startsWith("camel.jbang.build.image.tag"))[0].split("=")[1];
        expect(tag).to.equal(project.tag);
    });

});
