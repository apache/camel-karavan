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
import {ToggleGroup, ToggleGroupItem,} from '@patternfly/react-core';
import './DesignerSwitch.css';
import {useFileStore} from "@/api/ProjectStore";
import {shallow} from "zustand/shallow";
import {useDesignerStore} from "@/designer/DesignerStore";
import {getProjectFileTypeByName} from "@/api/ProjectModels";
import {CodeIcon} from "@patternfly/react-icons/dist/esm/icons";
import {DeploymentPattern} from "@carbon/icons-react";

export function DesignerToggle() {

    const [file] = useFileStore((s) => [s.file], shallow);
    const [setDesignerSwitch, designerSwitch] = useDesignerStore((s) => [s.setDesignerSwitch, s.designerSwitch], shallow)

    const fileType = getProjectFileTypeByName(file?.name || "");
    const showDesignerSwitch = fileType.filter(ft => ['INTEGRATION', 'KAMELET', 'OPENAPI' , 'ASYNCAPI'].includes(ft.name)).length > 0;

    return (
    <ToggleGroup aria-label="DesignerToggle">
        <ToggleGroupItem
            icon={<DeploymentPattern className='carbon'/>}
            aria-label="designer"
            text='Designer'
            buttonId="toggle-group-icons-1"
            isSelected={designerSwitch}
            isDisabled={!showDesignerSwitch}
            onChange={(_, __) => setDesignerSwitch(true)}
        />
        <ToggleGroupItem
            icon={<CodeIcon/>}
            text='Code'
            aria-label="code"
            buttonId="toggle-group-icons-2"
            isSelected={!designerSwitch}
            onChange={(_, __) => setDesignerSwitch(false)}
        />
    </ToggleGroup>
    )
}
