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

import React, {useEffect} from 'react';
import {
    Button,
    FlexItem,
    Toolbar,
    ToolbarContent,
    Tooltip
} from '@patternfly/react-core';
import '../designer/karavan.css';
import DownloadImageIcon from "@patternfly/react-icons/dist/esm/icons/image-icon";
import {CamelDefinitionYaml} from "karavan-core/lib/api/CamelDefinitionYaml";
import {useFileStore, useProjectStore} from "../api/ProjectStore";
import {EventBus} from "../designer/utils/EventBus";
import {shallow} from "zustand/shallow";

export function ImageDownloadToolbar() {

    const [project] = useProjectStore((s) => [s.project], shallow)
    const [file] = useFileStore((state) => [state.file], shallow)

    useEffect(() => {
    }, [file]);

    function isYaml(): boolean {
        return file !== undefined && file.name.endsWith("yaml");
    }

    function isIntegration(): boolean {
        return isYaml() && file?.code !== undefined && CamelDefinitionYaml.yamlIsIntegration(file.code) !== 'none';
    }

    function downloadImage() {
        EventBus.sendCommand("downloadImage");
    }

    return (
        <Toolbar id="toolbar-group-types">
            <ToolbarContent>
                {isIntegration() &&
                    <FlexItem>
                        {/*<Tooltip content="Download image" position={"bottom-end"}>*/}
                        {/*    <Button size="sm" variant="control" icon={<DownloadImageIcon/>}*/}
                        {/*            onClick={e => downloadImage()}/>*/}
                        {/*</Tooltip>*/}
                    </FlexItem>
                }
            </ToolbarContent>
        </Toolbar>
    )
}
