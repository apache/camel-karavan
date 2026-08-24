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
import {useFileStore} from "@stores/ProjectStore";
import {shallow} from "zustand/shallow";
import {getProjectFileTypeByName} from "@models/ProjectModels";
import {CodeIcon} from "@patternfly/react-icons";
import {DeploymentPattern, FileDiff, Thumbnail_1} from "@carbon/icons-react";
import {useDeveloperToggleStore} from "@developer/toggle/useDeveloperToggleStore";

export function DeveloperToggle() {

    const [file] = useFileStore((s) => [s.file], shallow);
    const [setDesignerSwitch, designerSwitch] = useDeveloperToggleStore((s) => [s.setDeveloperView, s.developerView], shallow)

    const fileType = getProjectFileTypeByName(file?.name || "");
    const showDesigner = fileType.filter(ft => ['INTEGRATION', 'KAMELET', 'OPENAPI', 'ASYNCAPI'].includes(ft.name)).length > 0;
    const showPreview = fileType.filter(ft => ['MARKDOWN', 'SVG'].includes(ft.name)).length > 0;

    return (
        <ToggleGroup aria-label="DeveloperToggle" className={"designer-toggle"}>
            {showDesigner &&
                <ToggleGroupItem
                    icon={<DeploymentPattern className='carbon'/>}
                    aria-label="designer"
                    text='Designer'
                    buttonId="designer"
                    isSelected={designerSwitch === 'designer'}
                    onChange={(_, __) => setDesignerSwitch('designer')}
                />
            }
            <ToggleGroupItem
                icon={<CodeIcon/>}
                text='Code'
                aria-label="code"
                buttonId="code"
                isSelected={designerSwitch === 'code'}
                onChange={(_, __) => setDesignerSwitch('code')}
            />
            {showPreview &&
                <ToggleGroupItem
                    icon={<Thumbnail_1 className='carbon'/>}
                    text='Preview'
                    aria-label="preview"
                    buttonId="preview"
                    isSelected={designerSwitch === 'preview'}
                    onChange={(_, __) => setDesignerSwitch("preview")}
                />
            }
            <ToggleGroupItem
                icon={<FileDiff className='carbon'/>}
                text='Diff'
                aria-label="diff"
                buttonId="diff"
                isSelected={designerSwitch === 'diff'}
                onChange={(_, __) => setDesignerSwitch("diff")}
            />
        </ToggleGroup>
    )
}
