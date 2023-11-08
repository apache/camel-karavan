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

import {Navigate, Route, Routes} from 'react-router-dom';
import React from "react";
import {ProjectsPage} from "../projects/ProjectsPage";
import {ProjectPage} from "../project/ProjectPage";
import {ServicesPage} from "../services/ServicesPage";
import {ContainersPage} from "../containers/ContainersPage";
import {KnowledgebasePage} from "../knowledgebase/KnowledgebasePage";
import {TemplatesPage} from "../templates/TemplatesPage";

export function MainRoutes() {

    return (
        <Routes>
            <Route path="/projects" element={<ProjectsPage key={'projects'}/>}/>
            <Route path="/projects/:projectId" element={<ProjectPage key={'project'}/>}/>
            <Route path="/templates" element={<TemplatesPage key={'templates'}/>}/>
            <Route path="/services" element={<ServicesPage key="services"/>}/>
            <Route path="/containers" element={<ContainersPage key="services"/>}/>
            <Route path="/knowledgebase" element={<KnowledgebasePage dark={false}/>}/>
            <Route path="*" element={<Navigate to="/projects" replace/>}/>
        </Routes>
    )
}
