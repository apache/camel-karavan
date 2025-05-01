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

import React from 'react';
import '../../designer/karavan.css';
import {BuildPanel} from "./BuildPanel";
import {PageSection} from "@patternfly/react-core";
import {useAppConfigStore} from "../../api/ProjectStore";
import {shallow} from "zustand/shallow";
import {ContainerPanel} from "./ContainerPanel";

export function PackageTab () {

    const [config] = useAppConfigStore((state) => [state.config], shallow)
    const isKubernetes = config.infrastructure === 'kubernetes'
    const isDev = config.environment === 'dev';
    const showBuildTab = isKubernetes || isDev;

    return (
        <PageSection className="project-tab-panel project-build-panel project-package" padding={{default: "padding"}}>
            <div>
                {showBuildTab && <BuildPanel/>}
                <ContainerPanel/>
            </div>
        </PageSection>
    )
}
