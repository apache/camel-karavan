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
import * as React from "react";
import "./index.css";
import "@patternfly/patternfly/patternfly.css";
import App from "./App";
import {render} from "react-dom";
import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

const rootElement = document.getElementById("root");
render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App page="designer"/>} />
            <Route path="kamelets-page" element={<App page="kamelets"/>} />
            <Route path="components-page" element={<App page="components"/>} />
            <Route path="eip-page" element={<App page="eip"/>} />
            <Route path="builder" element={<App page="builder"/>} />
        </Routes>
    </BrowserRouter>,
    rootElement
);
