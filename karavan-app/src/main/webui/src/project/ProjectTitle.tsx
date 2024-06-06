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
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Text,
    TextContent,
    Flex,
    FlexItem,
} from '@patternfly/react-core';
import '../designer/karavan.css';
import {getProjectFileTypeTitle} from "../api/ProjectModels";
import {useFileStore, useProjectStore} from "../api/ProjectStore";
import TopologyIcon from "@patternfly/react-icons/dist/js/icons/topology-icon";
import FilesIcon from "@patternfly/react-icons/dist/js/icons/folder-open-icon";
import {shallow} from "zustand/shallow";

export function ProjectTitle() {

    const [project, tabIndex, setTabIndex] =
        useProjectStore((s) => [s.project, s.tabIndex, s.setTabIndex], shallow);
    const [file,setFile, operation] = useFileStore((s) => [s.file, s.setFile, s.operation], shallow);

    const isFile = file !== undefined;
    const isLog = file !== undefined && file.name.endsWith("log");
    const filename = file ? file.name.substring(0, file.name.lastIndexOf('.')) : "";

    function getProjectTitle() {
        return (
            <Flex direction={{default: "column"}}>
                <FlexItem>
                    <TextContent className="title">
                        <Text component="h2">{project?.projectId}</Text>
                    </TextContent>
                </FlexItem>
                <FlexItem>
                    <TextContent>
                        <Text>{project?.name}</Text>
                    </TextContent>
                </FlexItem>
            </Flex>
        )
    }

    function getFileTitle() {
        return (isFile ?
                <Flex alignItems={{default: "alignItemsCenter"}}>
                    <Flex direction={{default: "column"}}>
                        <FlexItem>
                            <Breadcrumb>
                                <BreadcrumbItem to="#" onClick={event => {
                                    setFile('none', undefined);
                                }}>
                                    <div className={"project-breadcrumb"}>{'Back to ' +project?.name + " project"}</div>
                                </BreadcrumbItem>
                                <BreadcrumbItem to="#" onClick={_ => {
                                    setTabIndex('topology');
                                    setFile('none', undefined);
                                }}>
                                    <TopologyIcon/>
                                </BreadcrumbItem>
                                <BreadcrumbItem to="#files" onClick={_ => {
                                    setTabIndex('files');
                                    setFile('none', undefined);
                                }}>
                                    <FilesIcon/>
                                </BreadcrumbItem>
                            </Breadcrumb>
                        </FlexItem>
                        <FlexItem>
                            <Flex direction={{default: "row"}}>
                                <FlexItem>
                                    <Badge>{getProjectFileTypeTitle(file)}</Badge>
                                </FlexItem>
                                <FlexItem>
                                    <TextContent className="description">
                                        <Text>{isLog ? filename : file.name}</Text>
                                    </TextContent>
                                </FlexItem>
                            </Flex>
                        </FlexItem>
                    </Flex>
                </Flex>
                : <></>
        )
    }

    return (
        <div className="dsl-title project-title">
            {isFile && getFileTitle()}
            {!isFile && getProjectTitle()}
        </div>
    )
}
